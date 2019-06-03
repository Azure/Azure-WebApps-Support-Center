using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.IO;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.AzureAD.UI;
using AppLensV3.Services;
using System;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Linq;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Tokens.Saml;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.WsFederation;
using Microsoft.IdentityModel.Tokens.Saml2;
using idunno.Authentication.Certificate;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AppLensV3
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();

            if (env.IsDevelopment())
            {
                builder.AddApplicationInsightsSettings(developerMode: true);
            }

            Configuration = builder.Build();
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddApplicationInsightsTelemetry(Configuration);

            services.AddSingleton(Configuration);

            services.AddSingleton<IObserverClientService, SupportObserverClientService>();
            services.AddSingleton<IDiagnosticClientService, DiagnosticRoleClient>();
            services.AddSingleton<IGithubClientService, GithubClientService>();
            services.AddSingleton<IKustoQueryService, KustoQueryService>();
            services.AddSingleton<IKustoTokenRefreshService, KustoTokenRefreshService>();
            services.AddSingleton<IOutageCommunicationService, OutageCommunicationService>();
            services.AddSingleton<ILocalDevelopmentClientService, LocalDevelopmentClientService>();
            services.AddSingleton<IEmailNotificationService, EmailNotificationService>();
            services.AddSingleton<IGraphClientService, GraphClientService>();
            services.AddSingleton<IGraphTokenService, GraphTokenService>();
            services.AddSingleton<ISupportTopicService, SupportTopicService>();
            services.AddSingleton<ISelfHelpContentService, SelfHelpContentService>();

            services.AddMemoryCache();
            services.AddMvc();

            if (Configuration.GetValue<bool>("DatacenterFederationEnabled", false))
            {
                services.AddAuthentication(options =>
                {
                    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = WsFederationDefaults.AuthenticationScheme;
                })
                .AddWsFederation(options =>
                {
                    options.MetadataAddress = Configuration["DatacenterFederationConfiguration:MetadataAddress"];
                    options.Wtrealm = Configuration["DatacenterFederationConfiguration:Realm"];
                    options.ClaimsIssuer = Configuration["DatacenterFederationConfiguration:Issuer"];
                    options.SecurityTokenHandlers = new List<ISecurityTokenValidator> { new Saml2SecurityTokenHandler() };
                })
                .AddCookie();
            }
            else
            {
                services.AddAuthentication(auth =>
                {
                    auth.DefaultScheme = AzureADDefaults.BearerAuthenticationScheme;
                })
                .AddAzureADBearer(options =>
                {
                    Configuration.Bind("AzureAd", options);
                });

                if (Configuration["ServerMode"] == "internal")
                {
                    services.AddTransient<IFilterProvider, LocalFilterProvider>();
                }
            }

            services.AddAuthentication()
                .AddCertificate(options =>
                {
                    options.Events = new CertificateAuthenticationEvents
                    {
                        OnValidateCertificate = validateCertificationContext =>
                        {
                            if (validateCertificationContext.ClientCertificate != null)
                            {
                                var validThumbprints = Configuration.GetValue<string>("AllowedCertThumbprints")?.Split(",", StringSplitOptions.RemoveEmptyEntries);

                                if (validThumbprints == null)
                                {
                                    validateCertificationContext.Fail("Failed to validate certificate.");
                                }

                                if (validThumbprints.Any(thumbprint => thumbprint.Equals(validateCertificationContext.ClientCertificate.Thumbprint, StringComparison.CurrentCultureIgnoreCase)))
                                {
                                    validateCertificationContext.Success();
                                }
                                else
                                {
                                    validateCertificationContext.Fail("Certificate is not valid.");
                                }
                            }

                            return Task.CompletedTask;
                        }
                    };
                });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseCors(cors =>
                cors
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowAnyOrigin()
                .WithExposedHeaders(new string[] { "diag-script-etag" })
            );

            app.UseAuthentication();

            app.UseMvc();

            app.Use(async (context, next) =>
            {
                await next();
                if (context.Response.StatusCode == 404 &&
                    !Path.HasExtension(context.Request.Path.Value) &&
                    !context.Request.Path.Value.StartsWith("/api/"))
                {
                    context.Request.Path = "/index.html";
                    await next();
                }
            });

            app.UseDefaultFiles();
            app.UseStaticFiles();
        }
    }

    // Use this to skip Auth on local server
    public class LocalFilterProvider : IFilterProvider
    {
        public int Order
        {
            get
            {
                return -1500;
            }
        }

        public void OnProvidersExecuted(FilterProviderContext context)
        {
        }

        public void OnProvidersExecuting(FilterProviderContext context)
        {
            // remove authorize filters
            var authFilters = context.Results.Where(x => x.Descriptor.Filter.GetType() == typeof(AuthorizeFilter)).ToList();
            foreach (var filter in authFilters)
            {
                context.Results.Remove(filter);
            }
        }
    }
}
