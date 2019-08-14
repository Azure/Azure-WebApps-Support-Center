using System;
using System.Collections.Generic;
using System.IO;
using AppLensV3.Services;
using AppLensV3.Services.DiagnosticClientService;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.AzureAD.UI;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.WsFederation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Tokens.Saml2;

namespace AppLensV3.Configuration
{
    /// <summary>
    /// Startup class for production national cloud. Runtime will use this class when ASPNETCORE_ENVIRONMENT = NationalCloud.
    /// </summary>
    public class StartupNationalCloud
    {
        private readonly IConfiguration configuration;
        private readonly IHostingEnvironment env;

        /// <summary>
        /// Initializes a new instance of the <see cref="StartupNationalCloud"/> class.
        /// </summary>
        /// <param name="configuration">DI Configuration.</param>
        public StartupNationalCloud(IConfiguration configuration, IHostingEnvironment env)
        {
            this.configuration = configuration;
            this.env = env;
        }

        /// <summary>
        /// Automatically called by the runtime by convention to setup services for the app.
        /// </summary>
        /// <param name="services">services.</param>
        public virtual void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton<IDiagnosticClientService, DiagnosticClient>();
            services.AddSingleton<IObserverClientService, DiagnosticObserverClientService>();
            services.AddSingleton<IEmailNotificationService, NullableEmailNotificationService>();
            services.AddMemoryCache();

            if (env.IsEnvironment("NationalCloud"))
            {
                services.AddMvc();
                services.AddAuthentication(options =>
                {
                    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = WsFederationDefaults.AuthenticationScheme;
                })
                .AddWsFederation(options =>
                {
                    options.MetadataAddress = configuration["DatacenterFederationConfiguration:MetadataAddress"];
                    options.Wtrealm = configuration["DatacenterFederationConfiguration:Realm"];
                    options.ClaimsIssuer = configuration["DatacenterFederationConfiguration:Issuer"];
                    options.SecurityTokenHandlers = new List<ISecurityTokenValidator> { new Saml2SecurityTokenHandler() };
                })
                .AddCookie(options =>
                {
                    options.ForwardDefaultSelector = context =>
                    {
                        string authScheme = null;
                        if (context.Request.Headers.TryGetValue("Authorization", out StringValues authHeaders) && authHeaders[0].StartsWith("Bearer", StringComparison.CurrentCultureIgnoreCase))
                        {
                            authScheme = AzureADDefaults.BearerAuthenticationScheme;
                        }

                        return authScheme;
                    };
                })
                .AddAzureADBearer(options =>
                {
                    configuration.Bind("AzureAd", options);
                });
            }
            else
            {
                services.AddMvc(setup =>
                {
                    setup.Filters.Add(new AllowAnonymousFilter());
                });
            }
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            app.UseCors(cors =>
                cors
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowAnyOrigin()
                .WithExposedHeaders(new string[] { "diag-script-etag" }));

            if (env.IsEnvironment("NationalCloud"))
            {
                app.UseAuthentication();
                app.Use(async (context, next) =>
                {
                    if (!context.User.Identity.IsAuthenticated)
                    {
                        if (!context.Request.Path.ToString().Contains("signin"))
                        {
                            context.Response.Redirect($"https://{context.Request.Host}/federation/signin", false);
                        }
                        else
                        {
                            //The controller is backed by auth, get auth middleware to kick in
                            await next.Invoke();
                        }
                    }
                    else
                    {
                        if (context.Request.Path.ToString().Contains("signin"))
                        {
                            context.Response.Redirect($"https://{context.Request.Host}/index.html", true);
                        }
                        else
                        {
                            await next.Invoke();
                        }
                    }
                });
            }
            else
            {
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
            }

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseMvc();
        }
    }
}
