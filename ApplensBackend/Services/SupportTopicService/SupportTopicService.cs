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
    public class SupportTopicService: ISupportTopicService
    {

        private IKustoQueryService _kustoQueryService;

        private string _supportTopicsQuery = @"
        cluster('azsupport').database('AzureSupportability').ActiveSupportTopicTree
        | where ProductId in ('{PRODUCTID}') 
        | where Timestamp > ago(3d)
        | summarize by ProductId, SupportTopicId = SupportTopicL3Id, ProductName, SupportTopicL2Name, SupportTopicL3Name
        | where SupportTopicId != '' and SupportTopicL2Name != '' and SupportTopicL3Name != ''
        | extend SupportTopicPath = strcat(ProductName, ""/"", SupportTopicL2Name,""/"", SupportTopicL3Name)
        ";

        public SupportTopicService(IKustoQueryService kustoQueryService)
        {
            _kustoQueryService = kustoQueryService;
        }

        public async Task<List<SupportTopic>> GetSupportTopicsAsync(string productId)
        {
            if (string.IsNullOrWhiteSpace(productId))
            {
                throw new ArgumentNullException("productId");
            }

            string kustoQuery = _supportTopicsQuery
                .Replace("{PRODUCTID}", productId);

            DataTable dt = await _kustoQueryService.ExecuteQueryAsync("azsupport", "AzureSupportability", kustoQuery);

            List<SupportTopic> supportTopicsList = new List<SupportTopic>();

            if (dt == null || dt.Rows == null || dt.Rows.Count == 0)
            {
                return supportTopicsList;
            }

            foreach (DataRow row in dt.Rows)
            {
                SupportTopic supportTopic = new SupportTopic
                {
                    ProductId = row["ProductId"].ToString(),
                    SupportTopicId = row["SupportTopicId"].ToString(),
                    ProductName = row["ProductName"].ToString(),
                    SupportTopicL2Name = row["SupportTopicL2Name"].ToString(),
                    SupportTopicL3Name = row["SupportTopicL3Name"].ToString(),
                    SupportTopicPath = row["SupportTopicPath"].ToString()
                };

                supportTopicsList.Add(supportTopic);
            }

            return supportTopicsList;
        }
    }
}
