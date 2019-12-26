using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Backend.Services
{
    public class ArmService : IArmService
    {
        private readonly string _armEndpoint = "management.azure.com";
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

        public ArmService(IConfiguration configuration)
        {
            _armEndpoint = configuration["Arm:Endpoint"];
        }

        public async Task<bool> CheckSubscriptionAccessAsync(string subscriptionId, string bearerToken)
        {
            if (string.IsNullOrWhiteSpace(subscriptionId))
            {
                throw new ArgumentNullException("subscriptionId");
            }

            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, $"https://{_armEndpoint}/subscriptions/{subscriptionId}?api-version=2014-04-01");
            request.Headers.Add("Authorization", bearerToken ?? string.Empty);

            var response = await this._httpClient.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
    }
}
