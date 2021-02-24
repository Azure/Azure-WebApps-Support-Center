using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services.LocationPlacementIdService
{
    public class LocationPlacementIdService : ILocationPlacementIdService
    {
        private IKustoQueryService _kustoClient;
        private const string _appServiceDiagnosticsLocationPlacementIdQuery = @"";

        public LocationPlacementIdService(IKustoQueryService kustoClient)
        {
            _kustoClient = kustoClient;
        }

        public async Task<string[]> GetLocationPlacementIdAsync(string subscriptionId)
        {
            var sd = await GetLocationPlacementIdAsync();
            return sd.GetProperty(subscriptionId, "locationPlacementId");
        }

        private async Task<SubscriptionPropertiesDictionary> GetLocationPlacementIdAsync()
        {
            SubscriptionPropertiesDictionary sd = null;
            var _appServiceDiagnosticsLocationPlacementIdQuery = @"
ClientTelemetryNew
| project TIMESTAMP, action, actionModifier, data
| where TIMESTAMP >= ago(45d) and action == ""diagnostic-data"" and actionModifier == ""SubscriptionProperties""
| extend data = tolower(data)
| parse data with *""subscriptionid="" SubscriptionId "";subscriptionlocationplacementid="" LocationPlacementId "";"" *
| summarize by SubscriptionId, LocationPlacementId";

            try
            {
                var results = await _kustoClient.ExecuteQueryAsync("appsvcux", "APPSvcUx", _appServiceDiagnosticsLocationPlacementIdQuery);

                if (results.Rows.Count > 0)
                {
                    sd = new SubscriptionPropertiesDictionary();
                    foreach (DataRow row in results.Rows)
                    {
                        var subscriptionId = row["SubscriptionId"].ToString();
                        var locationPlacementId = row["LocationPlacementId"].ToString();

                        if (!string.IsNullOrWhiteSpace(subscriptionId) && !string.IsNullOrWhiteSpace(locationPlacementId))
                        {
                            sd.AddProperty(subscriptionId, "locationPlacementId", locationPlacementId);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new LocationPlacementIdException("Failed to get subscription properties information from Kusto: eg.,locationPlacementId", ex);
                // silently ignore
            }

            return sd;
        }

        private class SubscriptionPropertiesDictionary : Dictionary<string, List<KeyValuePair<string, string>>>
        {
            public void AddProperty(string subscriptionId, string name, string value)
            {
                if (ContainsKey(subscriptionId.ToLower()))
                {
                    this[subscriptionId].Add(new KeyValuePair<string, string>(name, value));
                }
                else
                {
                    Add(name, new List<KeyValuePair<string, string>> { new KeyValuePair<string, string>(name, value) });
                }
            }

            public string[] GetProperty(string subscriptionId, string name)
            {
                if (ContainsKey(subscriptionId))
                {
                    var valueBag = this[subscriptionId];
                    var result = valueBag.Where((kv) => kv.Key.Equals(name, StringComparison.CurrentCultureIgnoreCase)).Select((kv) => kv.Value).ToArray();
                    if (result.Any())
                    {
                        return result;
                    }
                }

                throw new KeyNotFoundException($"Cant find property {name}");
            }
        }
    }

    internal class LocationPlacementIdException : Exception
    {
        public LocationPlacementIdException(string message, Exception innerException) : base(message, innerException) { }
    }
}
