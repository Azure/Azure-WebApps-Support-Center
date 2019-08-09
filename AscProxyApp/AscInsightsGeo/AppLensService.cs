using Microsoft.Azure.Services.AppAuthentication;
using System;
using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace AscInsightsGeo
{
    public class AppLensService
    {
        private static Lazy<HttpClient> _clientLazy = new Lazy<HttpClient>(CreateClient);
        private static AzureServiceTokenProvider tokenProvider = new AzureServiceTokenProvider();
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
            client.BaseAddress = new Uri(Constants.AscInsightsServiceBaseAddress);
            client.MaxResponseContentBufferSize = Int32.MaxValue;
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            return client;
        }

        public async Task<HttpResponseMessage> GetInsights(string subscriptionId, string resourceGroupName, string provider, string resourceType, string resourceName, string pesId, string supportTopicId, string startTime, string endTime)
        {
            //The AzureServiceTokenProvider class caches the token in memory and retrieves it from Azure AD just before expiration. 
            var token = await tokenProvider.GetAccessTokenAsync("192bd8f2-c844-4977-aefd-77407619e80c");
            var path = $"api/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/{provider}/{resourceType}/{resourceName}/insights?pesId={pesId}&supportTopicId={supportTopicId}&startTime={startTime}&endTime={endTime}";
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return await _client.GetAsync(path);
        }
    }
}