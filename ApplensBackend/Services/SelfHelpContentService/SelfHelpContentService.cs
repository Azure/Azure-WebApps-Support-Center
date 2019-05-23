using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Microsoft.Extensions.Configuration;
using Octokit;
using Newtonsoft.Json;

namespace AppLensV3.Services
{
    public class SelfHelpContentService : ISelfHelpContentService
    {
        private IConfiguration _configuration;
        private ConcurrentDictionary<string, ConcurrentDictionary<string, string>> SelfHelpCache { get; set; }

        private GitHubClient OctokitClient { get; set; }

        private HttpClient HttpClient { get; set; }

        private string UserName { get; set; }

        private string RepoName { get; set; }

        private string Branch { get; set; }

        private string AccessToken { get; set; }

        private string CacheSelfHelpPaths { get; set; }

        public void LoadConfigurations()
        {
            UserName = _configuration["SelfHelpContent:UserName"];
            RepoName = _configuration["SelfHelpContent:RepoName"];
            Branch = _configuration["SelfHelpContent:Branch"];
            AccessToken = _configuration["SelfHelpContent:AccessToken"];
            CacheSelfHelpPaths = _configuration["SelfHelpContent:CacheSelfHelpPaths"];
        }

        private void InitializeHttpClient()
        {
            HttpClient = new HttpClient
            {
                MaxResponseContentBufferSize = int.MaxValue,
                Timeout = TimeSpan.FromSeconds(30)
            };

            HttpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            HttpClient.DefaultRequestHeaders.Add("User-Agent", "applensv3");
        }

        public SelfHelpContentService(IConfiguration configuration)
        {
            _configuration = configuration;
            LoadConfigurations();

            InitializeHttpClient();
            SelfHelpCache = new ConcurrentDictionary<string, ConcurrentDictionary<string, string>>();

            OctokitClient = new GitHubClient(new Octokit.ProductHeaderValue(UserName))
            {
                Credentials = new Credentials(AccessToken)
            };

            StartPollingSelfHelp();
        }

        public async Task<HttpResponseMessage> GetFileContent(string fileDataUrl)
        {
            try
            {
                HttpRequestMessage fileContentRequest = new HttpRequestMessage(HttpMethod.Get, fileDataUrl);
                HttpResponseMessage fileContentResponse = await HttpClient.SendAsync(fileContentRequest);

                return fileContentResponse;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public async Task<string> PullSelfHelpContent(string pesId, string supportTopicId, string path)
        {
            try
            {
                HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, path);
                HttpResponseMessage response = await HttpClient.SendAsync(request);
                var selfHelpStr = string.Empty;

                if (response != null)
                {
                    string content = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        var tasks = new List<Task<HttpResponseMessage>>();
                        dynamic metaDataSet = JsonConvert.DeserializeObject(content);

                        foreach (var fileData in metaDataSet)
                        {
                            if (!fileData.name.ToString().Contains("-scoping-"))
                            {
                                string fileDataUrl = fileData.download_url;
                                tasks.Add(Task.Run(() => GetFileContent(fileDataUrl)));
                            }
                        }

                        var staticFiles = await Task.WhenAll(tasks);
                        var cacheValue = SelfHelpCache.TryGetValue(pesId, out ConcurrentDictionary<string, string> supportTopicsSelfHelp);

                        if (!cacheValue)
                        {
                            var selfHelpMapping = new ConcurrentDictionary<string, string>();
                            for (int i = 0; i < staticFiles.Length; i++)
                            {
                                if (staticFiles[i].IsSuccessStatusCode)
                                {
                                    string fileContent = await staticFiles[i].Content.ReadAsStringAsync();

                                    string[] separators = { "supportTopicIds=", "productPesIds=" };

                                    string[] substrs = fileContent.Split(separators, StringSplitOptions.RemoveEmptyEntries);
                                    string supportTopicIds = substrs[1].Split('"', StringSplitOptions.RemoveEmptyEntries)[0];
                                    string productId = substrs[2].Split('"', StringSplitOptions.RemoveEmptyEntries)[0];

                                    if (supportTopicIds.Contains(supportTopicId))
                                    {
                                        selfHelpStr = fileContent;
                                    }

                                    selfHelpMapping.AddOrUpdate(supportTopicIds, fileContent, (key, oldvalue) => fileContent);
                                }
                            }

                            SelfHelpCache.AddOrUpdate(pesId, selfHelpMapping, (key, oldvalue) => selfHelpMapping);
                        }
                    }
                }

                return selfHelpStr;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public async Task<string> GetSelfHelpBySupportTopicFromGit(string pesId, string supportTopicId, string path)
        {
            var selfHelpUrl = string.Format(
            SelfHelpConstants.ArticleTemplatePath,
            path,
            AccessToken);

            return await PullSelfHelpContent(pesId, supportTopicId, selfHelpUrl);
        }

        public async Task<string> GetSelfHelpBySupportTopic(string pesId, string supportTopicId, string path)
        {

            var supportTopicsSelfHelp = SelfHelpCache.TryGetValue(pesId, out ConcurrentDictionary<string, string> resourceSelfHelp);
            if (supportTopicsSelfHelp && resourceSelfHelp.TryGetValue(supportTopicId, out string selfHelpContent))
            {
                return selfHelpContent;
            }
            else
            {
                return await GetSelfHelpBySupportTopicFromGit(pesId, supportTopicId, path);
            }
        }

        public async Task<string[]> StartPollingSelfHelp(int maxRetries = 3)
        {
            int retryCount = 0;
            do
            {
                try
                {
                    char[] separators = { ' ', ',', ';', ':' };
                    string[] selfHelpPaths = CacheSelfHelpPaths.Split(separators, StringSplitOptions.RemoveEmptyEntries).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

                    var tasks = new List<Task<string>>();
                    foreach (var path in selfHelpPaths)
                    {
                        Console.WriteLine("Get self helf for {0}", path);
                        tasks.Add(Task.Run(() => GetSelfHelpBySupportTopicFromGit(string.Empty, string.Empty, path)));
                    }

                    var selfHelpFiles = await Task.WhenAll(tasks);
                    return selfHelpFiles;
                }
                catch (Exception ex)
                {
                    // Ignore exception for now
                    return null;
                }
                finally
                {
                    retryCount++;
                }
            }
            while (retryCount < maxRetries);
        }
    }
}


