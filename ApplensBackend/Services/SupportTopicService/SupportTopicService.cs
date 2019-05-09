using AppLensV3.Helpers;
using AppLensV3.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class SupportTopicService
    {

        private IKustoQueryService _kustoQueryService;

        private TimeSpan _commAlertWindow = TimeSpan.FromDays(2);
        private TimeSpan _commExpandedWindow = TimeSpan.FromDays(1);

        private string _supportTopicsQuery = @"
        let startDate = datetime({START_TIME});
        let endDate = datetime({END_TIME});
        cluster('azsupport').database('AzureSupportability').ActiveSupportTopicTree
 | where ProductId in ('14748') 
| summarize by ProductId, SupportTopicId = SupportTopicL3Id, ProductName, SupportTopicL2Name, SupportTopicL3Name   
        ";

        public SupportTopicService(IKustoQueryService kustoQueryService)
        {
            _kustoQueryService = kustoQueryService;
        }

        public async Task<List<Communication>> GetSupportTopicsAsync(string subscription, DateTime startTime, DateTime endTime, string impactedService = "appservice")
        {
            if (string.IsNullOrWhiteSpace(subscription))
            {
                throw new ArgumentNullException("subscription");
            }

            if (string.IsNullOrWhiteSpace(impactedService))
            {
                impactedService = "appservice";
            }

            DateTime currentTimeUTC = DateTime.UtcNow;

            string startTimeStr = DateTimeHelper.GetDateTimeInUtcFormat(startTime).ToString("yyyy-MM-dd HH:mm:ss");
            string endTimeStr = DateTimeHelper.GetDateTimeInUtcFormat(endTime).ToString("yyyy-MM-dd HH:mm:ss");

            string kustoQuery = _supportTopicsQuery
                .Replace("{START_TIME}", startTimeStr)
                .Replace("{END_TIME}", endTimeStr)
                .Replace("{SUBSCRIPTION}", subscription);

            DataTable dt = await _kustoQueryService.ExecuteQueryAsync("azsupport", "AzureSupportability", kustoQuery);

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
                        // NOTE:- For now, resolved incidents will be collapsed by Default.
                        // Uncommenting below line would make resolved incidents expanded by default for certain timespan.
                        //rca.IsExpanded = ((currentTimeUTC - rca.PublishedTime) <= _commExpandedWindow);
                        impactedServiceComm = rca;
                    }
                    else if ((currentTimeUTC - mostRecentImpactedServiceComm.PublishedTime) <= _commAlertWindow)
                    {
                        mostRecentImpactedServiceComm.IsAlert = true;
                        // NOTE:- For now, resolved incidents will be collapsed by Default.
                        // Uncommenting below line would make resolved incidents expanded by default for certain timespan.
                        //mostRecentImpactedServiceComm.IsExpanded = ((currentTimeUTC - mostRecentImpactedServiceComm.PublishedTime) <= _commExpandedWindow);
                        impactedServiceComm = mostRecentImpactedServiceComm;
                    }
                }
            }

            return commsList;
        }

        private List<ImpactedService> GetImpactedRegions(string jsonStr)
        {
            var impactedServices = new List<ImpactedService>();
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
