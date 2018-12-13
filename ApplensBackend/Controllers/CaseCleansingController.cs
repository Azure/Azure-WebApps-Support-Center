using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Data.SqlClient;
using Dapper;
using Dapper.Contrib.Extensions;
using Kusto.Data.Net.Client;
using System.Dynamic;
using Kusto.Data;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Controllers
{
    [Produces("application/json")]
    [Route("api/casecleansing")]
    [Authorize]
    public class CaseCleansingController : Controller
    {
        public class CaseSimple
        {
            public string IncidentId { get; set; }
            public DateTime Time { get; set; }
            public string Status { get; set; }
            public string AssignedTo { get; set; }
            public DateTime ClosedTime { get; set; }
            public int ID { get; set; }
            public int RecommendationCount { get; set; }
            public string Title { get; set; }
        }

        public class CaseExtra
        {
            public Recommendation[] Recommendations { get; set; }
            public dynamic KustoData { get; set; }
        }

        public class Recommendation
        {
            public string RuleName { get; set; }
            public string OldClosedAgainst { get; set; }
            public string RecommendedClosedAgainst { get; set; }
            public DateTime RecommendationDate { get; set; }
        }

        private IConfiguration _configuration;
        private class CaseCleansingConfiguration
        {
            public string ConnectionString { get; set; }
            public string KustoP360ConnectionString { get; set; }
        }

        private readonly CaseCleansingConfiguration _caseCleansingConfiguration;

        public CaseCleansingController(IConfiguration configuration)
        {
            _configuration = configuration;
            _caseCleansingConfiguration = new CaseCleansingConfiguration();
            configuration.GetSection("CaseCleansing").Bind(_caseCleansingConfiguration);
        }

        [HttpGet("getallcases")]
        public CaseSimple[] Get()
        {
            string str = @"SELECT IncidentId, Time, Status, AssignedTo, ClosedTime, Incidents.ID As ID, Count(RuleID) As RecommendationCount, Title
                            FROM Incidents 
                            JOIN Statuses ON Statuses.Id=Incidents.ID
                            JOIN Recommendations ON Recommendations.Id=Incidents.ID
                            WHERE Status = 'OPEN'
                            GROUP BY IncidentId, Time, Status, AssignedTo, ClosedTime, Incidents.ID, Title
                            ORDER BY Time Desc;";

            using (SqlConnection connection = new SqlConnection(_caseCleansingConfiguration.ConnectionString))
            {
                var res = connection.Query<CaseSimple>(str);
                return res.ToArray();
            }
        }

        [HttpGet("getcase/{id}")]
        public CaseExtra Get(string id)
        {
            CaseExtra extra = new CaseExtra();
            //Get Recommendations from SQL
            string SQLQueryString = @"SELECT RuleName, OldClosedAgainst, RecommendedClosedAgainst, Recommendations.Date As RecommendationDate
                                    FROM Incidents 
                                    JOIN Recommendations ON Recommendations.Id=Incidents.ID
                                    JOIN Rules ON Recommendations.RuleId=Rules.RuleId
                                    WHERE IncidentId = @IncidentId;";

            using (SqlConnection connection = new SqlConnection(_caseCleansingConfiguration.ConnectionString))
            {
                var res = connection.Query<Recommendation>(SQLQueryString, new { IncidentId = id });
                extra.Recommendations = res.ToArray();
            }

            //Get More Info from Kusto
            string kustoQueryString = $@"SupportProductionClosedVolumeDailyVer1023
                                        | where Incidents_IncidentId == {id}";

            var queryProvider = KustoClientFactory.CreateCslQueryProvider(_caseCleansingConfiguration.KustoP360ConnectionString);

            var reader = queryProvider.ExecuteQuery(kustoQueryString);

            dynamic kustoResult = new ExpandoObject();

            if (reader.Read())
            {
                var dictionary = (IDictionary<string, object>)kustoResult;
                for (int i = 0; i < reader.FieldCount; ++i)
                {
                    dictionary[reader.GetName(i)] = reader.GetValue(i);
                }
            }
            else
            {
                kustoResult.Error = "Result no longer in DB";
            }

            extra.KustoData = kustoResult;

            return extra;
        }

        [HttpGet("closecase/{incidentId}/{closeReason}")]
        public bool CloseCase(string incidentId, string closeReason)
        {
            string sqlUpdate = "UPDATE Statuses SET status = @closeReason, time = @utcnow WHERE Id = @internalId";
            using (SqlConnection connection = new SqlConnection(_caseCleansingConfiguration.ConnectionString))
            {
                int internalId = GetLocalID(connection, incidentId);
                if (internalId == -1)
                {
                    return false;
                }


                return connection.Execute(sqlUpdate, new { internalId = internalId, closeReason = closeReason, utcnow = DateTime.UtcNow }) > 0;
            }
        }

        private static int GetLocalID(SqlConnection connection, string IncidentId)
        {
            int localID;
            var caseIDs = connection.Query<int>("SELECT ID from Incidents where IncidentId = @incidentId", new { incidentId = IncidentId });
            if (caseIDs.Count() == 0)
            {
                localID = -1;
            }
            else
            {
                localID = caseIDs.First();
            }

            return localID;
        }
    }
}
