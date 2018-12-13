using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Helpers
{
    internal class Constants
    {
    }

    internal class GithubConstants
    {
        internal const string RawFileHeaderMediaType = "application/vnd.github.VERSION.raw";
        internal const string DetectorTemplatePath = "https://raw.githubusercontent.com/Azure/Azure-AppServices-Diagnostics/master/data/templates/{filename}.csx";
        internal const string DetectorFilePathFormat = "https://api.github.com/repos/{0}/{1}/contents/{2}/{2}.csx?ref={3}&access_token={4}";
    }

    internal class KustoConstants
    {
        internal static TimeSpan DefaultTimeGrain = TimeSpan.FromMinutes(5);
        internal const string MicrosoftTenantAuthorityUrl = "https://login.windows.net/microsoft.com";
        internal const int TokenRefreshIntervalInMs = 10 * 60 * 1000;   // 10 minutes
        internal const string DefaultKustoEndpoint = "https://wawswus.kusto.windows.net";
        internal const string KustoApiEndpointFormat = "https://{0}.kusto.windows.net:443/v1/rest/query";
    }
}
