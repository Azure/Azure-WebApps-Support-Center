using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace AscInsightsGeo
{
    public class AppLensService
    {
        private static Lazy<HttpClient> _clientLazy = new Lazy<HttpClient>(CreateClient);

        private static HttpClient _client
        {
            get
            {
                return _clientLazy.Value;
            }
        }

        private static HttpClient CreateClient()
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(ConfigManager.Get(Constants.AscInsightsServiceBaseAddress));
            client.MaxResponseContentBufferSize = Int32.MaxValue;
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            return client;
        }

        public async Task<HttpResponseMessage> GetInsights(string subscriptionId, string resourceGroupName, string provider, string resourceType, string resourceName, string pesId, string supportTopicId, string startTime, string endTime)
        {
            var path = $"api/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/{provider}/{resourceType}/{resourceName}/insights?pesId={pesId}&supportTopicId={supportTopicId}&startTime={startTime}&endTime={endTime}";
            return await _client.GetAsync(path);
        }
    }
}