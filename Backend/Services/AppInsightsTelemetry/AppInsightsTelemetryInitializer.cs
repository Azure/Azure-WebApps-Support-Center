using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.ApplicationInsights.Channel;
using Microsoft.Extensions.Configuration;

namespace Backend.Services
{
    public class AppInsightsTelemetryInitializer : ITelemetryInitializer
    {
        private readonly string environmentName;
        private readonly string websiteHostName;

        public AppInsightsTelemetryInitializer(IConfiguration configuration)
        {
            this.environmentName = configuration["ASD_ENVIRONMENT"];
            this.websiteHostName = configuration["ASD_HOST"];
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