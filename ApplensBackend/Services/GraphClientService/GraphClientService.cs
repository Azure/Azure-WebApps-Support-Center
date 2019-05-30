using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Models;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;

namespace AppLensV3.Services
{
    public interface IGraphClientService
    {
        Task<string> GetOrCreateUserImageAsync(string userId);
        Task<string> GetUserImageAsync(string userId);
        Task<IDictionary<string, string>> GetUsers(string[] users);
        Task<AuthorInfo> GetUserInfoAsync(string userId);
    }

    public class GraphClientService : IGraphClientService
    {
        private IMemoryCache _cache;

        private IGraphTokenService _graphTokenService;

        private readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            return client;
        });

        private HttpClient _httpClient
        {
            get
            {
                return _client.Value;
            }
        }

        public GraphClientService(IMemoryCache cache, IGraphTokenService graphTokenService)
        {
            _cache = cache;
            _graphTokenService = graphTokenService;
        }

        public async Task<string> GetOrCreateUserImageAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("userId");
            }

            var userImage = await
                _cache.GetOrCreateAsync(userId, entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(14);
                    return GetUserImageAsync(userId);
                });

            return userImage;
        }

        public async Task<AuthorInfo> GetUserInfoAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("userId");
            }

            string authorizationToken = await _graphTokenService.GetAuthorizationTokenAsync();

            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, string.Format(GraphConstants.GraphUserApiEndpointFormat, userId));
            request.Headers.Add("Authorization", authorizationToken);

            CancellationTokenSource tokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));
            HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);

            string result = string.Empty;
            AuthorInfo userInfo = null;

            if (responseMsg.IsSuccessStatusCode)
            {
                result = await responseMsg.Content.ReadAsStringAsync();
                dynamic resultObject = JsonConvert.DeserializeObject(result);

                userInfo = new AuthorInfo(
                    resultObject.businessPhones.ToString(),
                    resultObject.displayName.ToString(),
                    resultObject.givenName.ToString(),
                    resultObject.jobTitle.ToString(),
                    resultObject.mail.ToString(),
                    resultObject.officeLocation.ToString(),
                    resultObject.userPrincipalName.ToString());
            }

            return userInfo;
        }

        public async Task<string> GetUserImageAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("userId");
            }

            var tasks = new List<Task>();

            string authorizationToken = await _graphTokenService.GetAuthorizationTokenAsync();
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, string.Format(GraphConstants.GraphUserImageApiEndpointFormat, userId));
            request.Headers.Add("Authorization", authorizationToken);

            CancellationTokenSource tokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));
            HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);

            string result = string.Empty;

            // If the status code is 404 NotFound, it might because the user doesn't have a profile picture, or the user alias is invalid.
            // We set the image string to be empty if the response is not successful
            if (responseMsg.IsSuccessStatusCode)
            {
                var content = Convert.ToBase64String(await responseMsg.Content.ReadAsByteArrayAsync());
                result = string.Concat("data:image/jpeg;base64,", content);
            }

            return result;
        }

        public async Task<IDictionary<string, string>> GetUsers(string[] users)
        {

            var tasks = new List<Task>();
            var authorsDictionary = new ConcurrentDictionary<string, string>();

            foreach (var user in users)
            {
                tasks.Add(Task.Run(async () =>
                {
                    var userImage = await GetOrCreateUserImageAsync(user);
                    authorsDictionary.AddOrUpdate(user, userImage, (k, v) => userImage);
                }));
            }

            await Task.WhenAll(tasks);
            return authorsDictionary;
        }
    }
}