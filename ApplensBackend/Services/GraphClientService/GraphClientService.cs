using System;
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

namespace AppLensV3.Services
{
    public interface IGraphClientService {
        Task<string> GetUserImage(string userId);
    }


    public class GraphClientService : IGraphClientService
    {
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

        public GraphClientService(IGraphTokenService graphTokenService)
        {
            _graphTokenService = graphTokenService;
        }

        public async Task<string> GetUserImage(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("userId");
            }

            try
            {

                string authorizationToken = await _graphTokenService.GetAuthorizationTokenAsync();

                var getUserAvatarUri = $"https://graph.microsoft.com/v1.0/users/{userId}@microsoft.com/photo/$value";

                string uri = $"users/{userId}@microsoft.com/photo/$value";


                //HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, $"https://graph.microsoft.com/v1.0/users/{userId}@microsoft.com/photo/$value");
                HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, string.Format(GraphConstants.GraphApiEndpointFormat, uri));

                request.Headers.Add("Authorization", authorizationToken);
                //request.Headers.Add("x-ms-client-request-id", requestId ?? Guid.NewGuid().ToString());


                //object requestPayload = new
                //{
                //    db = database,
                //    csl = query
                //};

                //request.Content = new StringContent(JsonConvert.SerializeObject(requestPayload), Encoding.UTF8, "application/json");

                CancellationTokenSource tokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);
                if (responseMsg.IsSuccessStatusCode)
                {
                    var content = Convert.ToBase64String(await responseMsg.Content.ReadAsByteArrayAsync());
                    //Byte[] imageArray = File.ReadAllBytes(fs.FullName);
                    //string base64ImageRepresentation = Convert.ToBase64String(imageArray);
                    return content;
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

        //public async Task<Stream> GetEntityPropertyStreamAsync<T, S>(Expression<Func<T, bool>> keyPredicate, Expression<Func<T, S>> propertyName, string acceptMediaType)
        //{
        //    Uri entityByKeyUri = this.BuildRequestUri<T, string>(predicate: keyPredicate);
        //    Uri streamUri = entityByKeyUri.Append($"/{(propertyName.Body as MemberExpression).Member.Name}");

        //    HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, streamUri);
        //    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue(acceptMediaType));

        //    HttpResponseMessage response = await this.SendAsync<object>(HttpMethod.Get, streamUri.ToString(), null, acceptMediaType);
        //    return await response.Content.ReadAsStreamAsync();
        //}

        //public aysnc Task<UserImage> RetrieveUserTHumbnail()
        //{
        //    UserImage user
        //}
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



