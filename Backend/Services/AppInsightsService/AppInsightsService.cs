using Newtonsoft.Json.Linq;
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Backend.Models;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Linq;

namespace Backend.Services
{
    public class AppInsightsService : IAppInsightsService
    {
        const string ApiKeyName = "APPSERVICEDIAGNOSTICS_READONLYKEY";
        const string AppInsightsTagName = "hidden-related:diagnostics/applicationInsightsSettings";
        private readonly IEncryptionService _encryptionService;

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

        public AppInsightsService(IEncryptionService encryptionService)
        {
            _encryptionService = encryptionService;
        }

        private async Task CheckAndRemoveExistingApiKeysAsync(string appInsightsResourceId, string bearerToken)
        {
            HttpRequestMessage request = new HttpRequestMessage
            {
                Method = HttpMethod.Get,
                RequestUri = new Uri($"https://management.azure.com{appInsightsResourceId}/ApiKeys?api-version=2015-05-01"),
            };
            request.Headers.Add("Authorization", bearerToken ?? string.Empty);
            var response = await _httpClient.SendAsync(request);

            response.EnsureSuccessStatusCode();

            var existingKeys = JsonConvert.DeserializeObject<AppInsightsApiKeysResponse>(await response.Content.ReadAsStringAsync());
            if (existingKeys != null && existingKeys.value != null && existingKeys.value.Length > 0)
            {
                var existingKey = existingKeys.value.FirstOrDefault(x => x.name.Equals(ApiKeyName, StringComparison.OrdinalIgnoreCase));
                if (existingKey != null)
                {
                    await RemoveExistingApiKey(bearerToken, existingKey.id);
                }
            }
        }

        public async Task<bool> ConnectApplicationInsights(string resourceId, string appInsightsResourceId, string appInsightsAppId, string bearerToken)
        {
            await CheckAndRemoveExistingApiKeysAsync(appInsightsResourceId, bearerToken);
            var apiKey = await GenerateAppInsightsApiKeyAsync(appInsightsResourceId, bearerToken);
            var tagsContent = await GetUpdatedTagsAsync(resourceId, apiKey, appInsightsAppId, bearerToken);

            HttpRequestMessage request = new HttpRequestMessage
            {
                Method = new HttpMethod("PATCH"),
                RequestUri = new Uri($"https://management.azure.com{resourceId}?api-version=2018-02-01"),
                Content = new StringContent(tagsContent, Encoding.UTF8, "application/json")
            };

            request.Headers.Add("Authorization", bearerToken ?? string.Empty);
            var response = await this._httpClient.SendAsync(request);

            response.EnsureSuccessStatusCode();
            return true;
        }

        private async Task<string> GenerateAppInsightsApiKeyAsync(string appInsightsResourceId, string bearerToken)
        {
            var body = new AppInsightsApiKeySettings
            {
                name = ApiKeyName,
                linkedReadProperties = new string[] { $"{appInsightsResourceId}/api" }
            };

            var request = new HttpRequestMessage
            {
                Method = HttpMethod.Post,
                RequestUri = new Uri($"https://management.azure.com{appInsightsResourceId}/ApiKeys?api-version=2015-05-01"),
                Content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json")
            };

            request.Headers.Add("Authorization", bearerToken ?? string.Empty);
            var response = await this._httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var appInsightsResponse = JsonConvert.DeserializeObject<AppInsightsApiKeyResponse>(await response.Content.ReadAsStringAsync());
            return appInsightsResponse.apiKey;
        }

        private async Task RemoveExistingApiKey(string bearerToken, string appKeyResourceId)
        {
            var request = new HttpRequestMessage
            {
                Method = HttpMethod.Delete,
                RequestUri = new Uri($"https://management.azure.com{appKeyResourceId}?api-version=2015-05-01"),
            };
            request.Headers.Add("Authorization", bearerToken ?? string.Empty);

            var response = await this._httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
        }

        private async Task<string> GetUpdatedTagsAsync(string resourceId, string apiKey, string appId, string bearerToken)
        {
            HttpRequestMessage request = new HttpRequestMessage
            {
                Method = HttpMethod.Get,
                RequestUri = new Uri($"https://management.azure.com{resourceId}?api-version=2018-02-01"),
            };
            request.Headers.Add("Authorization", bearerToken ?? string.Empty);

            var response = await this._httpClient.SendAsync(request);

            response.EnsureSuccessStatusCode();

            var site = JObject.Parse(await response.Content.ReadAsStringAsync());
            JObject tagsObject = JObject.Parse(site["tags"].ToString());

            var tagValue = new AppInsightsTagValue
            {
                ApiKey = _encryptionService.EncryptString(apiKey),
                AppId = appId
            };

            tagsObject[AppInsightsTagName] = JsonConvert.SerializeObject(tagValue);
            var tagsContent = new
            {
                tags = tagsObject
            };

            return JsonConvert.SerializeObject(tagsContent);
        }

    }
}
