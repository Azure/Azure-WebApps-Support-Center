using Backend.Helpers;
using Backend.Models;
using Backend.Services;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class OutageCommunicationService : IOutageCommunicationService
    {
        private IKustoQueryService _kustoQueryService;

        private TimeSpan _commAlertWindow = TimeSpan.FromDays(2);
        private TimeSpan _commExpandedWindow = TimeSpan.FromDays(1);

        private string _commsQuery = @"
        let startDate = datetime({START_TIME});
        let endDate = datetime({END_TIME});
        cluster('Icmcluster').database('ACM.Backend'). 
        GetCommunicationsBySubIdAndDateRange(@'{SUBSCRIPTION}', startDate, endDate) 
        | where CommunicationType == 'Outage'
        | order by PublishedTime asc
        | project CommunicationId, PublishedTime, Title, RichTextMessage, Status, Severity, IncidentId, CommunicationType, ImpactedServices
        ";

        public OutageCommunicationService(IKustoQueryService kustoQueryService)
        {
            _kustoQueryService = kustoQueryService;
        }

        public async Task<List<Communication>> GetCommunicationsAsync(string subscription, DateTime startTime, DateTime endTime, string impactedService = "appservice")
        {
            if (string.IsNullOrWhiteSpace(subscription))
            {
                throw new ArgumentNullException("subscription");
            }

            if (string.IsNullOrWhiteSpace(impactedService))
            {
                throw new ArgumentNullException("impactedService");
            }

            DateTime currentTimeUTC = DateTime.UtcNow;

            string startTimeStr = DateTimeHelper.GetDateTimeInUtcFormat(startTime).ToString("yyyy-MM-dd HH:mm:ss");
            string endTimeStr = DateTimeHelper.GetDateTimeInUtcFormat(endTime).ToString("yyyy-MM-dd HH:mm:ss");

            string kustoQuery = _commsQuery
                .Replace("{START_TIME}", startTimeStr)
                .Replace("{END_TIME}", endTimeStr)
                .Replace("{IMPACTED_SERVICE}", impactedService)
                .Replace("{SUBSCRIPTION}", subscription);

            DataTable dt = await this._kustoQueryService.ExecuteQueryAsync("Icmcluster", "ACM.Backend", kustoQuery);

            List<Communication> commsList = new List<Communication>();

            if (dt == null || dt.Rows == null || dt.Rows.Count == 0)
            {
                return commsList;
            }

            foreach (DataRow row in dt.Rows)
            {
                Communication comm = new Communication
                {
                    CommunicationId = row["CommunicationId"].ToString(),
                    PublishedTime = DateTimeHelper.GetDateTimeInUtcFormat(DateTime.Parse(row["PublishedTime"].ToString())),
                    Title = row["Title"].ToString(),
                    RichTextMessage = row["RichTextMessage"].ToString(),
                    Status = row["Status"].ToString().Equals("Active", StringComparison.OrdinalIgnoreCase) ? CommunicationStatus.Active : CommunicationStatus.Resolved,
                    IncidentId = row["IncidentId"].ToString()
                };

                comm.ImpactedServices = GetImpactedRegions(row["ImpactedServices"].ToString());
                commsList.Add(comm);
            }

            commsList = commsList.OrderByDescending(p => p.PublishedTime).ToList();

            Communication impactedServiceComm = null;
            Communication mostRecentImpactedServiceComm = commsList.FirstOrDefault(p => p.ImpactedServices.Exists(q => q.Name.ToLower().Contains(impactedService.ToLower())));
            if (mostRecentImpactedServiceComm != null)
            {
                if (mostRecentImpactedServiceComm.Status == CommunicationStatus.Active)
                {
                    mostRecentImpactedServiceComm.IsAlert = true;
                    mostRecentImpactedServiceComm.IsExpanded = true;
                    impactedServiceComm = mostRecentImpactedServiceComm;
                }
                else if (mostRecentImpactedServiceComm.Status == CommunicationStatus.Resolved)
                {
                    Communication rca = commsList.FirstOrDefault(p => (
                                p.IncidentId == mostRecentImpactedServiceComm.IncidentId &&
                                p.PublishedTime > mostRecentImpactedServiceComm.PublishedTime &&
                                p.CommunicationId != mostRecentImpactedServiceComm.CommunicationId &&
                                p.Title.ToUpper().Contains("RCA")));

                    if (rca != null && ((currentTimeUTC - rca.PublishedTime) <= _commAlertWindow))
                    {
                        rca.IsAlert = true;
                        rca.IsExpanded = ((currentTimeUTC - rca.PublishedTime) <= _commExpandedWindow);
                        impactedServiceComm = rca;
                    }
                    else if ((currentTimeUTC - mostRecentImpactedServiceComm.PublishedTime) <= _commAlertWindow)
                    {
                        mostRecentImpactedServiceComm.IsAlert = true;
                        mostRecentImpactedServiceComm.IsExpanded = ((currentTimeUTC - mostRecentImpactedServiceComm.PublishedTime) <= _commExpandedWindow);
                        impactedServiceComm = mostRecentImpactedServiceComm;
                    }
                }
            }

            if (impactedServiceComm != null)
            {
                // Found an Comm for the desired impacted service
                return commsList;
            }

            Communication otherComm = commsList.FirstOrDefault(p => !p.ImpactedServices.Any(q => q.Name.ToLower().Contains(impactedService.ToLower())));

            if (otherComm != null && (otherComm.Status == CommunicationStatus.Active || (otherComm.Status == CommunicationStatus.Resolved && ((currentTimeUTC - otherComm.PublishedTime) < _commAlertWindow))))
            {
                otherComm.IsAlert = true;
                otherComm.IsExpanded = false;
            }

            return commsList;
        }

        private List<ImpactedService> GetImpactedRegions(string jsonStr)
        {
            List<ImpactedService> impactedServices = new List<ImpactedService>();
            if (string.IsNullOrWhiteSpace(jsonStr))
            {
                return impactedServices;
            }

            JToken obj = JsonConvert.DeserializeObject<JToken>(jsonStr);

            foreach (var entry in obj)
            {
                ImpactedService service = new ImpactedService
                {
                    Name = entry["ServiceName"].Value<string>()
                };

                JToken regions = entry["ImpactedRegions"].Value<JToken>();
                foreach (var region in regions)
                {
                    service.Regions.Add(region["RegionName"].Value<string>());
                }

                impactedServices.Add(service);
            }

            return impactedServices;
        }
    }
}
