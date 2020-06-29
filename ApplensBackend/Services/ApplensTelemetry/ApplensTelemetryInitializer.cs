using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.ApplicationInsights.Channel;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services.ApplensTelemetryInitializer
{
    public class ApplensTelemetryInitializer : ITelemetryInitializer
    {
        private readonly string environmentName;
        private readonly string websiteHostName;

        public ApplensTelemetryInitializer(IConfiguration configuration)
        {
            this.environmentName = configuration["APPLENS_ENVIRONMENT"];
            this.websiteHostName = configuration["APPLENS_HOST"];
        }

        public void Initialize(ITelemetry telemetry)
        {
            if (!telemetry.Context.GlobalProperties.ContainsKey("environment"))
            {
                telemetry.Context.GlobalProperties.Add("environment", this.environmentName);
            }

            if (!telemetry.Context.GlobalProperties.ContainsKey("websiteHostName"))
            {
                telemetry.Context.GlobalProperties.Add("websiteHostName", this.websiteHostName);
            }
        }
    }
}