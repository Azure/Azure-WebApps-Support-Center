﻿using System;
using System.IO;
using System.Globalization;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http;
using System.Net.Http.Headers;
using AppLensV3.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using System.Threading;
using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Mvc;

namespace AppLensV3.Services
{
    public interface IGraphClientService {
        Task<string> GetOrCreateUserImageAsync(string userId);
        Task<string> GetUserImageAsync(string userId);
        Task<IDictionary<string, string>> GetUsers(string[] users);
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
        }
        );

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
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7);
                    return GetUserImageAsync(userId);
                });
         
            return userImage;
        }

        public IActionResult CacheRemove(string userId)
        {
            _cache.Remove(userId);
            return null;
        }

        public async Task<string> GetUserImageAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("userId");
            }

            try
            {
                var tasks = new List<Task>();
                string authorizationToken = await _graphTokenService.GetAuthorizationTokenAsync();

                var getUserAvatarUri = $"https://graph.microsoft.com/v1.0/users/{userId}@microsoft.com/photo/$value";

                string uri = $"users/{userId}@microsoft.com/photo/$value";
                string userApiUri = $"users/{userId}@microsoft.com";

                HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, string.Format(GraphConstants.GraphApiEndpointFormat, uri));
               // HttpRequestMessage userDateRequest = new HttpRequestMessage(HttpMethod.Get, string.Format(GraphConstants.GraphApiEndpointFormat, userApiUri));

                request.Headers.Add("Authorization", authorizationToken);
              //  userDateRequest.Headers.Add("Authorization", authorizationToken);


                CancellationTokenSource tokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);

                string result = string.Empty;


                // If the status code is 404 NotFound, it might because the user doesn't have a profile picture, or the user alias is invalid.
                // We set the image string to be empty if the response is not successful
                if (responseMsg.IsSuccessStatusCode)
                {
                    var content = Convert.ToBase64String(await responseMsg.Content.ReadAsByteArrayAsync());
                    result = String.Concat("data:image/jpeg;base64,", content);
                    //Byte[] imageArray = File.ReadAllBytes(fs.FullName);
                    //string base64ImageRepresentation = Convert.ToBase64String(imageArray);
                }

                return result;

            }
            catch (Exception e)
            {
                throw;
            }


            return null;
        }

        public async Task<string> GetUserImage(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("userId");
            }

            try
            {
                var tasks = new List<Task>();
                string authorizationToken = await _graphTokenService.GetAuthorizationTokenAsync();

                var getUserAvatarUri = $"https://graph.microsoft.com/v1.0/users/{userId}@microsoft.com/photo/$value";

                string uri = $"users/{userId}@microsoft.com/photo/$value";
                string userApiUri = $"users/{userId}@microsoft.com";

                HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, string.Format(GraphConstants.GraphApiEndpointFormat, uri));

                request.Headers.Add("Authorization", authorizationToken);


                CancellationTokenSource tokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);

                if (responseMsg.IsSuccessStatusCode)
                {
                    var content = Convert.ToBase64String(await responseMsg.Content.ReadAsByteArrayAsync());
                    var result = String.Concat("data:image/jpeg;base64,", content);
                    //Byte[] imageArray = File.ReadAllBytes(fs.FullName);
                    //string base64ImageRepresentation = Convert.ToBase64String(imageArray);
                    return result;
                }
                else
                {
                    throw new Exception($"Failed to obtain avatar for user {userId}");
                }

            }
            catch (Exception e)
            {
                throw;
            }
           

            return null;
        }

        public async Task<IDictionary<string, string>> GetUsers(string[] users)
        {

            try
            {
                var tasks = new List<Task>();
                var authorsDictionary = new ConcurrentDictionary<string, string>();
                string authorizationToken = await _graphTokenService.GetAuthorizationTokenAsync();
                
                CancellationTokenSource tokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));

                foreach (var user in users)
                {
                    string uri = $"users/{user}@microsoft.com/photo/$value";
                    string userApiUri = $"users/{user}@microsoft.com";
                    HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, string.Format(GraphConstants.GraphApiEndpointFormat, uri));

                    request.Headers.Add("Authorization", authorizationToken);

                    tasks.Add(Task.Run(async () =>
                    {
                        var userImage = await GetOrCreateUserImageAsync(user);
                        authorsDictionary.AddOrUpdate(user, userImage, (k, v) => userImage);
                        //HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);

                        //string content = String.Empty;

                        //if (responseMsg.IsSuccessStatusCode)
                        //{
                        //    // content = Convert.ToBase64String(await responseMsg.Content.ReadAsByteArrayAsync());
                        //    string imageBase64String = Convert.ToBase64String(await responseMsg.Content.ReadAsByteArrayAsync());
                        //    content = String.Concat("data:image/jpeg; base64,", imageBase64String);
                        //}

                       // authorsDictionary.AddOrUpdate(user, content, (k, v) => content);
                    }));

                }

                await Task.WhenAll(tasks);
                return authorsDictionary;
            }
            catch (Exception e)
            {
                throw;
            }


            return null;
        }

    }

    public static class CacheKeys
    {
        public static string UserId { get { return "_UserId"; } }
        public static string CallbackEntry { get { return "_Callback"; } }
        public static string CallbackMessage { get { return "_CallbackMessage"; } }
        public static string Parent { get { return "_Parent"; } }
        public static string Child { get { return "_Child"; } }
        public static string DependentMessage { get { return "_DependentMessage"; } }
        public static string DependentCTS { get { return "_DependentCTS"; } }
        public static string Ticks { get { return "_Ticks"; } }
        public static string CancelMsg { get { return "_CancelMsg"; } }
        public static string CancelTokenSource { get { return "_CancelTokenSource"; } }
    }

    public class UserInfo
    {
        public string displayName { get; set; }
        public string givenName { get; set; }
        public string mail { get; set; }
        public string officeLocation { get; set; }
        public string photoBase64 { get; set; }
    }



    public class UserImage
    {
        public string userId { get; set; }
        public string image { get; set; }
        public string etag { get; set; }
        public string imageId { get; set; }
        public string mediaContentType { get; set; }
        public int width { get; set; }
        public int height { get; set; }

        public static implicit operator UserImage(PhotoMetadata metadata)
        {
            UserImage image = new UserImage();
            if (metadata == null)
                return image;
            image.height = metadata.Height;
            image.width = metadata.Width;
            image.imageId = metadata.OdataId;
            image.mediaContentType = metadata.MediaContentType;
            image.etag = metadata.MediaEtag;
            return image;
        }

    }

    public class PhotoMetadata
    {
        [JsonProperty("@odata.context")]
        public string OdataContext { get; set; }
        [JsonProperty("@odata.id")]
        public string OdataId { get; set; }
        [JsonProperty("@odata.mediaEtag")]
        public string MediaEtag { get; set; }
        [JsonProperty("id")]
        public string Id { get; set; }
        [JsonProperty("@odata.mediaContentType")]
        public string MediaContentType { get; set; }
        [JsonProperty("width")]
        public int Width { get; set; }
        [JsonProperty("height")]
        public int Height { get; set; }
    }
}



