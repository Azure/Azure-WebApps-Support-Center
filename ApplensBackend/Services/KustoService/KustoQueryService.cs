using AppLensV3.Helpers;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface IKustoQueryService
    {
        Task<DataTable> ExecuteQueryAsync(string cluster, string database, string query, string requestId = null);
    }

    public class KustoQueryService : IKustoQueryService
    {
        private IKustoTokenRefreshService _kustoTokenRefreshService;

        private readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            return client;
        }
        );

        private HttpClient _httpClient
        {
            get
            {
                return _client.Value;
            }
        }

        public KustoQueryService(IKustoTokenRefreshService kustoTokenRefreshService)
        {
            _kustoTokenRefreshService = kustoTokenRefreshService;
        }

        public async Task<DataTable> ExecuteQueryAsync(string cluster, string database, string query, string requestId = null)
        {
            if (string.IsNullOrWhiteSpace(cluster))
            {
                throw new ArgumentException("cluster");
            }

            if (string.IsNullOrWhiteSpace(database))
            {
                throw new ArgumentException("database");
            }

            if (string.IsNullOrWhiteSpace(query))
            {
                throw new ArgumentException("query");
            }

            string authorizationToken = await _kustoTokenRefreshService.GetAuthorizationTokenAsync();

            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, string.Format(KustoConstants.KustoApiEndpointFormat, cluster));
            request.Headers.Add("Authorization", authorizationToken);
            request.Headers.Add("x-ms-client-request-id", requestId ?? Guid.NewGuid().ToString());

            object requestPayload = new
            {
                db = database,
                csl = query
            };

            request.Content = new StringContent(JsonConvert.SerializeObject(requestPayload), Encoding.UTF8, "application/json");

            CancellationTokenSource tokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));
            HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);
            string content = await responseMsg.Content.ReadAsStringAsync();

            if (!responseMsg.IsSuccessStatusCode)
            {
                throw new Exception(content);
            }

            DataTableResponseObjectCollection dataSet = JsonConvert.DeserializeObject<DataTableResponseObjectCollection>(content);

            if (dataSet == null || dataSet.Tables == null)
            {
                return new DataTable();
            }
            else
            {
                return dataSet.Tables.FirstOrDefault().ToDataTable();
            }
        }
    }
}
