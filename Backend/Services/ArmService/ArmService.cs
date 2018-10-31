using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class ArmService : IArmService
    {
        private readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.Timeout = TimeSpan.FromSeconds(30);
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

        public async Task<bool> CheckSubscriptionAccessAsync(string subscriptionId, string bearerToken)
        {
            if (string.IsNullOrWhiteSpace(subscriptionId))
            {
                throw new ArgumentNullException("subscriptionId");
            }

            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, $"https://management.azure.com/subscriptions/{subscriptionId}?api-version=2014-04-01");
            request.Headers.Add("Authorization", bearerToken ?? string.Empty);

            var response = await this._httpClient.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
    }
}
