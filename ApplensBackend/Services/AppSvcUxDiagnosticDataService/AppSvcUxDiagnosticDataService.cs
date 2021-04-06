using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services.AppSvcUxDiagnosticDataService
{
    public class AppSvcUxDiagnosticDataService : IAppSvcUxDiagnosticDataService
    {
        private IKustoQueryService _kustoClient;
        private const string _appServiceDiagnosticsLocationPlacementIdQuery = @"";
        private Task<SubscriptionPropertiesDictionary> _subscriptionPropertiesTask;
        private IConfiguration _configuration;
        private DateTime _lastPersistDate;
        private static int _fetchingData = 0;

        private bool IsStaleData
        {
            get
            {
                return (DateTime.UtcNow - _lastPersistDate) > TimeSpan.FromMinutes(_configuration.GetValue<int>("LocationPlacementIdService:KustoIntervalInMinutes", 360));
            }
        }

        public AppSvcUxDiagnosticDataService(IKustoQueryService kustoClient, IConfiguration configuration)
        {
            _kustoClient = kustoClient;
            _configuration = configuration;
            _subscriptionPropertiesTask = GetSubscriptionProperties();
        }

        public async Task<string[]> GetLocationPlacementIdAsync(string subscriptionId)
        {
            try
            {
                if (IsStaleData)
                {
                    if (Interlocked.Exchange(ref _fetchingData, 1) == 0)
                    {
                        if (IsStaleData)
                        {
                            _lastPersistDate = DateTime.UtcNow;
                            _subscriptionPropertiesTask = GetSubscriptionProperties();
                        }

                        //Release the lock
                        Interlocked.Exchange(ref _fetchingData, 0);
                    }
                }

                var sd = await _subscriptionPropertiesTask;
                string[] locationPlacementIds = null;
                sd.TryGetProperty(subscriptionId, "locationPlacementId", out locationPlacementIds);
                return locationPlacementIds;
            }
            catch (Exception ex)
            {
                throw new LocationPlacementIdException("Failed to get locationPlacementId information", ex);
            }
        }

        /// <summary>
        /// We log subscripton data in the AppSvcUX cluster from our app service diagnostics codebase.
        /// </summary>
        private async Task<SubscriptionPropertiesDictionary> GetSubscriptionProperties()
        {
            SubscriptionPropertiesDictionary sd = null;
            const string _appServiceDiagnosticsLocationPlacementIdQuery = @"
ClientTelemetryNew
| project TIMESTAMP, action, actionModifier, data
| where TIMESTAMP >= ago(45d) and action == ""diagnostic-data"" and actionModifier == ""SubscriptionProperties""
| extend data = tolower(data)
| parse data with *""subscriptionid="" SubscriptionId "";subscriptionlocationplacementid="" LocationPlacementId "";"" *
| summarize by SubscriptionId, LocationPlacementId";

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

            return sd;
        }

        private class SubscriptionPropertiesDictionary : ConcurrentDictionary<string, List<KeyValuePair<string, string>>>
        {
            public void AddProperty(string subscriptionId, string name, string value)
            {
                AddOrUpdate(subscriptionId, new List<KeyValuePair<string, string>> { new KeyValuePair<string, string>(name, value) }, (k, propertiesList) =>
                {
                    propertiesList.Add(new KeyValuePair<string, string>(name, value));
                    return propertiesList;
                });
            }

            public bool TryGetProperty(string subscriptionId, string name, out string[] values)
            {
                if (TryGetValue(subscriptionId, out List<KeyValuePair<string, string>> subscriptionProperties))
                {
                    var result = subscriptionProperties.Where((kv) => kv.Key.Equals(name, StringComparison.CurrentCultureIgnoreCase)).Select((kv) => kv.Value).ToArray();
                    if (result.Any())
                    {
                        values = result;
                        return true;
                    }
                }

                values = null;
                return false;
            }
        }
    }

    internal class LocationPlacementIdException : Exception
    {
        public LocationPlacementIdException(string message, Exception innerException) : base(message, innerException) { }
    }
}
