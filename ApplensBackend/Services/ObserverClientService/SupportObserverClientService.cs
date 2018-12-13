using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using Newtonsoft.Json;
using System.Net;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Mvc;

namespace AppLensV3
{
    public class ObserverResponse
    {
        public HttpStatusCode StatusCode;

        public dynamic Content;
    }

    /// <summary>
    /// Client for Support Observer API communication
    /// </summary>
    public sealed class SupportObserverClientService: IObserverClientService
    {
        private static AuthenticationContext _authContext;
        private static ClientCredential _aadCredentials;
        private static string _supportObserverResourceUri;
        private static object lockObject = new object();
        private static bool targetSupportApiTestSlot;

        private IConfiguration _configuration;

        public SupportObserverClientService(IConfiguration configuration) {
            _configuration = configuration;
        }

        /// <summary>
        /// Support API Endpoint
        /// </summary>
        private string SupportObserverApiEndpoint {
            get
            {
                bool.TryParse(_configuration["Observer:targetSupportApiTestSlot"], out targetSupportApiTestSlot);

                //Add condition for Debugger.IsAttached so that we never mistakenly target Support Api test slot in production
                if (Debugger.IsAttached && targetSupportApiTestSlot)
                {
                    return "https://support-bay-api-test.azurewebsites.net/observer/";
                }
                else
                {
                    return "https://support-bay-api.azurewebsites.net/observer/";
                }
            }
        }

        private AuthenticationContext AuthContext {
            get
            {
                if (_authContext == null)
                {
                    _authContext = new AuthenticationContext("https://login.microsoftonline.com/microsoft.onmicrosoft.com", TokenCache.DefaultShared);
                }

                return _authContext;
            }
        } 

        private ClientCredential AADCredentials
        {
            get
            {
                if (_aadCredentials == null)
                {
                    var clientId = _configuration["Observer:clientId"];
                    var clientSecret = _configuration["Observer:clientSecret"];

                    _aadCredentials = new ClientCredential(clientId, clientSecret);
                }
                return _aadCredentials;
            }
        }

        private string SupportObserverResourceUri
        {
            get
            {
                if (_supportObserverResourceUri == null)
                {
                    _supportObserverResourceUri = _configuration["Observer:resourceId"];
                }

                return _supportObserverResourceUri;
            }
        }

        /// <summary>
        /// http client
        /// </summary>
        private static readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
            {
                var client = new HttpClient();
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.Timeout = TimeSpan.FromSeconds(30);

                return client;
            }
        );

        /// <summary>
        /// http client
        /// </summary>
        private static HttpClient _httpClient
        {
            get
            {
                return _client.Value;
            }
        }

        /// <summary>
        /// Get site details for siteName
        /// </summary>
        /// <param name="siteName">Site Name</param>
        public async Task<ObserverResponse> GetSite(string siteName)
        {
            return await GetSiteInternal(SupportObserverApiEndpoint + "sites/" + siteName + "/adminsites?api-version=2.0");
        }

        /// <summary>
        /// Get site details for siteName
        /// </summary>
        /// <param name="stamp">Stamp</param>
        /// <param name="siteName">Site Name</param>
        public async Task<ObserverResponse> GetSite(string stamp, string siteName)
        {
            return await GetSiteInternal(SupportObserverApiEndpoint + "stamps/" + stamp + "/sites/" + siteName + "/adminsites?api-version=2.0");
        }

        private async Task<ObserverResponse> GetSiteInternal(string endpoint)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(endpoint),
                Method = HttpMethod.Get
            };
            
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetAdminSite");
            return res;
        }

        /// <summary>
        /// Get resource group for site
        /// </summary>
        /// <param name="site">Site</param>
        /// <returns>Resource Group</returns>
        public async Task<ObserverResponse> GetResourceGroup(string site)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + "sites/" + site + "/resourcegroupname?api-version=2"),
                Method = HttpMethod.Get
            };
          
            var serializedParameters = JsonConvert.SerializeObject(new Dictionary<string, string>() { { "site", site } });
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetResourceGroup(2.0)");
            return res;
        }

        /// <summary>
        /// Get Stamp for siteName
        /// </summary>
        /// <param name="siteName">Site Name</param>
        /// <returns>Stamp</returns>
        public async Task<ObserverResponse> GetStamp(string siteName)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + "sites/" + siteName + "/stamp"),
                Method = HttpMethod.Get
            };

            var serializedParameters = JsonConvert.SerializeObject(new Dictionary<string, string>() { { "site", siteName } });
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetStamp");
            return res;
        }

        /// <summary>
        /// Get Hostnames for a site
        /// </summary>
        /// <param name="siteName">SiteName</param>
        /// <returns>Hostnames</returns>
        public async Task<ObserverResponse> GetHostnames(string siteName)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + "sites/" + siteName + "/hostnames?api-version=2.0"),
                Method = HttpMethod.Get
            };

            var serializedParameters = JsonConvert.SerializeObject(new Dictionary<string, string>() { { "site", siteName } });
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetHostnames(2.0)");
            return res;
        }

        public async Task<ObserverResponse> GetHostingEnvironmentDetails(string hostingEnvironmentName)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + "hostingEnvironments/" + hostingEnvironmentName + "?api-version=2.0"),
                Method = HttpMethod.Get
            };

            var serializedParameters = JsonConvert.SerializeObject(new Dictionary<string, string>() { { "hostingEnvironment", hostingEnvironmentName } });
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetHostingEnvironmentDetails(2.0)");
            return res;
        }

        public async Task<ObserverResponse> GetSitePostBody(string stamp, string site)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{SupportObserverApiEndpoint}stamps/{stamp}/sites/{site}/postbody"),
                Method = HttpMethod.Get
            };

            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetSitePostBody");
            return res;
        }

        public async Task<ObserverResponse> GetHostingEnvironmentPostBody(string name)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{SupportObserverApiEndpoint}hostingEnvironments/{name}/postbody"),
                Method = HttpMethod.Get
            };

            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetHostingEnvironmentPostBody");
            return res;
        }

        private async Task<ObserverResponse> CreateObserverResponse(HttpResponseMessage response, string apiName = "")
        {
            var observerResponse = new ObserverResponse();

            if (response == null)
            {
                observerResponse.StatusCode = HttpStatusCode.InternalServerError;
                observerResponse.Content = "Unable to fetch data from Observer API : " + apiName;
            }

            observerResponse.StatusCode = response.StatusCode;

            if (response.IsSuccessStatusCode)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                observerResponse.Content = JsonConvert.DeserializeObject(responseString);
            }
            else if(response.StatusCode == HttpStatusCode.NotFound)
            {
                observerResponse.Content = (string)"Resource Not Found. API : " + apiName;
            }
            else
            {
                observerResponse.Content = (string)"Unable to fetch data from Observer API : " + apiName;
            }

            return observerResponse;
        }

        private async Task<string> GetSupportObserverAccessToken()
        {
            var authResult = await AuthContext.AcquireTokenAsync(SupportObserverResourceUri, AADCredentials);
            return "Bearer " + authResult.AccessToken;
        }
    }
}