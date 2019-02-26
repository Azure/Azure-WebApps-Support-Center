using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.IO;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.AzureAD.UI;
using AppLensV3.Services;

namespace AppLensV3
{
    public class Startup {
        public Startup (IHostingEnvironment env) {

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
        public void ConfigureServices (IServiceCollection services) {            

            services.AddApplicationInsightsTelemetry(Configuration);

            services.AddSingleton(Configuration);

            services.AddSingleton<IObserverClientService, SupportObserverClientService>();
            services.AddSingleton<IDiagnosticClientService, DiagnosticRoleClient>();
            services.AddSingleton<IGithubClientService, GithubClientService>();
            services.AddSingleton<IKustoQueryService, KustoQueryService>();
            services.AddSingleton<IKustoTokenRefreshService, KustoTokenRefreshService>();
            services.AddSingleton<IOutageCommunicationService, OutageCommunicationService>();
            services.AddSingleton<ILocalDevelopmentClientService, LocalDevelopmentClientService>();

            services.AddMvc ();

            services.AddAuthentication(auth =>
            {
                auth.DefaultScheme = AzureADDefaults.BearerAuthenticationScheme;
            })
            .AddAzureADBearer(options => {
                Configuration.Bind("AzureAd", options);
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure (IApplicationBuilder app, IHostingEnvironment env) {
            
            if (env.IsDevelopment ()) {
                app.UseDeveloperExceptionPage();
            }

            // would not need cors if running in same host
            app.UseCors(cors =>
                cors
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowAnyOrigin()
                .WithExposedHeaders(new string[] {"script-etag"})
            );

            app.UseAuthentication();

            app.UseMvc ();

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

            app.UseDefaultFiles ();
            app.UseStaticFiles ();
        }
    }
}