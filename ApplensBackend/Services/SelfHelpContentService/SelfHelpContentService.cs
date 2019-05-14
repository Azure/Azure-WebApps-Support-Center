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
        public void StartPollingSelfHelp(int maxRetries = 3)
        {
            int retryCount = 0;
            do
            {
                try
                {

                    break;
                }
                catch (Exception ex)
                {
                    // Ignore exception for now
                    return;
                }
                finally
                {
                    retryCount++;
                }
            }
            while (retryCount < maxRetries);
        }


        /// <summary>
        /// Get changed files.
        /// </summary>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting changed files.</returns>
        public async Task<IEnumerable<string>> GetChangedFiles(string sha)
        {
            var allCommits = await OctokitClient.Repository.Commit.Get(UserName, RepoName, sha);
            return allCommits.Files
                .Where(f =>
                    f.Filename.EndsWith(".json", StringComparison.OrdinalIgnoreCase) ||
                    f.Filename.EndsWith(".csx", StringComparison.OrdinalIgnoreCase))
                .Select(f => f.Filename);
        }


        /// <summary>
        /// Get changed files.
        /// </summary>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting changed files.</returns>
        public async Task<HttpResponseMessage> GetFileContent(string fileDataUrl)
        {
            HttpRequestMessage fileContentRequest = new HttpRequestMessage(HttpMethod.Get, fileDataUrl);
            HttpResponseMessage fileContentResponse = await HttpClient.SendAsync(fileContentRequest);


            return fileContentResponse;
        }


        public async Task<HttpResponseMessage> GetSelfHelpContent(string selfHelpUrl)
        {
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, selfHelpUrl);
            HttpResponseMessage response = await HttpClient.SendAsync(request);

            var fileContentsTasks = new List<Task<string>>();
            if (response != null)
            {
                string content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var tasks = new List<Task<HttpResponseMessage>>();
                    dynamic metaDataSet = JsonConvert.DeserializeObject(content);

                    foreach (var fileData in metaDataSet)
                    {
                        if (!fileData.name.contains("-scoping-"))
                        {
                            string fileDataUrl = fileData.download_url;
                            tasks.Add(Task.Run(() => GetFileContent(fileDataUrl)));
                        }
                    }

                    var staticFiles = await Task.WhenAll(tasks);
                }
            }


            //DataTableResponseObjectCollection dataSet = JsonConvert.DeserializeObject<DataTableResponseObjectCollection>(content);

            return response;

        }

        /// <summary>
        /// Task for getting all commits.
        /// </summary>
        /// <param name="filePath">The filePath.</param>
        /// <returns>Task for getting commits.</returns>
        public async Task<HttpResponseMessage[]> GetAllSelfHelp()
        {
            char[] separators = { ' ', ',', ';', ':' };

            // Currently there's a bug in sendgrid v3, email will not be sent if there are duplicates in the recipient list
            // Remove duplicates before adding to the recipient list
            string[] selfHelpPaths = CacheSelfHelpPaths.Split(separators, StringSplitOptions.RemoveEmptyEntries).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();


            var tasks = new List<Task<HttpResponseMessage>>();
            foreach (var path in selfHelpPaths)
            {
                var gistFileUrl = string.Format(
                    SelfHelpConstants.ArticleTemplatePath,
                    path,
                    AccessToken);

                tasks.Add(Task.Run(() => GetSelfHelpContent(gistFileUrl)));
            }

            var selfHelpFiles = await Task.WhenAll(tasks);

            return selfHelpFiles;



            //GetRawFile(gistFileUrl);

            //CommitRequest request = new CommitRequest
            //{
            //    Path = filePath,
            //    Sha = Branch
            //};

            //var allCommits = await OctokitClient.Repository.Commit.GetAll(UserName, RepoName, request);
            //var res = new List<Models.Commit>();

            //var commits = allCommits
            //    .Select(p => new Tuple<string, DateTimeOffset, string>(p.Sha, p.Commit.Committer.Date, p.Commit.Message))
            //    .OrderByDescending(o => o.Item2);

            //var previousSha = string.Empty;
            //var currentSha = string.Empty;

            //var tasks = new List<Task<IEnumerable<string>>>();
            //foreach (var c in commits)
            //{
            //    tasks.Add(Task.Run(() => GetChangedFiles(c.Item1)));
            //}

            //var changedFiles = await Task.WhenAll(tasks);

            //for (int i = commits.Count() - 1; i >= 0; i--)
            //{
            //    if (!changedFiles[i].Any())
            //    {
            //        continue;
            //    }

            //    var commit = commits.ElementAt(i);
            //    previousSha = currentSha;
            //    currentSha = commit.Item1;

            //    if (commit.Item3.Contains("CommittedBy"))
            //    {
            //        string author = commit.Item3.Split(new string[] { "CommittedBy :" }, StringSplitOptions.RemoveEmptyEntries).Last();
            //        author = author.Replace("@microsoft.com", string.Empty, StringComparison.OrdinalIgnoreCase);
            //        string date = commit.Item2.ToString().Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).First();

            //        res.Add(new Models.Commit(currentSha, author, date, previousSha, changedFiles[i]));
            //    }
            //}

        }

        public async Task<string> GetSelfHelpContentsAsync(string pesId, string supportTopicId)
        {
            return null;
        }

        /// <param name="configuration">The configuration.</param>
        public SelfHelpContentService(IConfiguration configuration)
        {
            InitializeHttpClient();
            GitHubCache = new ConcurrentDictionary<string, Tuple<string, object>>();
            UserName = configuration["SelfHelpContent:UserName"];
            RepoName = configuration["SelfHelpContent:RepoName"];
            Branch = configuration["SelfHelpContent:Branch"];
            AccessToken = configuration["SelfHelpContent:AccessToken"];
            CacheSelfHelpPaths = configuration["SelfHelpContent:CacheSelfHelpPaths"];

            OctokitClient = new GitHubClient(new Octokit.ProductHeaderValue(UserName))
            {
                Credentials = new Credentials(AccessToken)
            };

            StartPollingSelfHelp();
        }

        private ConcurrentDictionary<string, Tuple<string, object>> GitHubCache { get; }

        private GitHubClient OctokitClient { get; }

        private HttpClient HttpClient { get; set; }

        private string UserName { get; }

        private string RepoName { get; }

        private string Branch { get; }

        private string AccessToken { get; }

        private string CacheSelfHelpPaths { get; }


        // ArticleTemplatePath
        /// <summary>
        /// Get raw file.
        /// </summary>
        /// <param name="url">The url.</param>
        /// <returns>Task for getting raw file.</returns>
        public async Task<string> GetRawFile(string url)
        {
            TryGetETAGAndCacheValue(url, out string etag, out object cachedValue, out bool isEntryInCache);

            List<KeyValuePair<string, string>> additionalHeaders = new List<KeyValuePair<string, string>>();
            additionalHeaders.Add(new KeyValuePair<string, string>("Accept", GithubConstants.RawFileHeaderMediaType));
            HttpResponseMessage response = await GetInternal(url, etag, additionalHeaders);
            if (response.StatusCode == HttpStatusCode.NotModified)
            {
                if (isEntryInCache)
                {
                    return cachedValue.ToString();
                }

                throw new Exception($"url content not found in cache : {url}");

                // TODO : If entry is not in cache for some reason, we need to fetch it again from github without etag header to refresh the cache
            }

            //    private ConcurrentDictionary<string, Tuple<string, object>> GitHubCache { get; }

            response.EnsureSuccessStatusCode();
            cachedValue = await response.Content.ReadAsStringAsync();
            etag = GetHeaderValue(response, "ETag").Replace("W/", string.Empty);
            Tuple<string, object> cachedInfo = new Tuple<string, object>(etag, cachedValue);
            GitHubCache.AddOrUpdate(url, cachedInfo, (key, oldvalue) => cachedInfo);

            return cachedValue.ToString();
        }

        /// <summary>
        /// Get source file.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting source file.</returns>
        public async Task<string> GetSourceFile(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentNullException(nameof(id));
            }

            var gistFileUrl = string.Format(
                GithubConstants.SourceFilePathFormat,
                UserName,
                RepoName,
                id,
                Branch,
                AccessToken);

            return await GetRawFile(gistFileUrl);
        }

        /// <summary>
        /// Get package configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting configuration.</returns>
        public async Task<string> GetConfiguration(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentNullException(nameof(id));
            }

            var gistFileUrl = string.Format(
                GithubConstants.ConfigPathFormat,
                UserName,
                RepoName,
                id,
                Branch,
                AccessToken);

            return await GetRawFile(gistFileUrl);
        }

        /// <summary>
        /// Get commit content.
        /// </summary>
        /// <param name="filePath">The file path.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit content.</returns>
        public async Task<string> GetCommitContent(string filePath, string sha)
        {
            try
            {
                var commitContent = await OctokitClient.Repository.Content.GetAllContentsByRef(UserName, RepoName, filePath, sha);
                return commitContent?[0].Content;
            }
            catch (NotFoundException)
            {
                // Ignore exception and return empty string.
                return string.Empty;
            }
        }

        /// <summary>
        /// Get commit configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit configuration.</returns>
        public async Task<string> GetCommitConfiguration(string id, string sha)
        {
            var filePath = $"{id.ToLower()}/package.json";

            var commitContent = await OctokitClient.Repository.Content.GetAllContentsByRef(UserName, RepoName, filePath, sha);
            return commitContent?[0].Content;
        }

        /// <summary>
        /// Task for getting all commits.
        /// </summary>
        /// <param name="filePath">The filePath.</param>
        /// <returns>Task for getting commits.</returns>
        public async Task<List<Models.Commit>> GetAllCommits(string filePath)
        {
            CommitRequest request = new CommitRequest
            {
                Path = filePath,
                Sha = Branch
            };

            var allCommits = await OctokitClient.Repository.Commit.GetAll(UserName, RepoName, request);
            var res = new List<Models.Commit>();

            var commits = allCommits
                .Select(p => new Tuple<string, DateTimeOffset, string>(p.Sha, p.Commit.Committer.Date, p.Commit.Message))
                .OrderByDescending(o => o.Item2);

            var previousSha = string.Empty;
            var currentSha = string.Empty;

            var tasks = new List<Task<IEnumerable<string>>>();
            foreach (var c in commits)
            {
                tasks.Add(Task.Run(() => GetChangedFiles(c.Item1)));
            }

            var changedFiles = await Task.WhenAll(tasks);

            for (int i = commits.Count() - 1; i >= 0; i--)
            {
                if (!changedFiles[i].Any())
                {
                    continue;
                }

                var commit = commits.ElementAt(i);
                previousSha = currentSha;
                currentSha = commit.Item1;

                if (commit.Item3.Contains("CommittedBy"))
                {
                    string author = commit.Item3.Split(new string[] { "CommittedBy :" }, StringSplitOptions.RemoveEmptyEntries).Last();
                    author = author.Replace("@microsoft.com", string.Empty, StringComparison.OrdinalIgnoreCase);
                    string date = commit.Item2.ToString().Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).First();

                    res.Add(new Models.Commit(currentSha, author, date, previousSha, changedFiles[i]));
                }
            }

            return res;
        }

        /// <summary>
        /// Get changed files.
        /// </summary>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting changed files.</returns>
        public async Task<IEnumerable<string>> GetChangedFiles(string sha)
        {
            var allCommits = await OctokitClient.Repository.Commit.Get(UserName, RepoName, sha);
            return allCommits.Files
                .Where(f =>
                    f.Filename.EndsWith(".json", StringComparison.OrdinalIgnoreCase) ||
                    f.Filename.EndsWith(".csx", StringComparison.OrdinalIgnoreCase))
                .Select(f => f.Filename);
        }

        private async Task<HttpResponseMessage> GetInternal(string url, string etag, List<KeyValuePair<string, string>> additionalHeaders = null)
        {
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, url);
            if (!string.IsNullOrWhiteSpace(etag))
            {
                request.Headers.Add("If-None-Match", etag);
            }

            if (additionalHeaders != null && additionalHeaders.Any())
            {
                additionalHeaders.ForEach(item => request.Headers.Add(item.Key, item.Value));
            }

            HttpResponseMessage response = await HttpClient.SendAsync(request);

            if (response.StatusCode >= HttpStatusCode.NotFound)
            {
                string exceptionDetails = await response.Content.ReadAsStringAsync();
                throw new Exception($"Github call failed. Http Status Code : {response.StatusCode}, Exception : {exceptionDetails}");
            }

            return response;
        }

        private void TryGetETAGAndCacheValue(string url, out string etag, out object cachedValue, out bool isEntryInCache)
        {
            etag = string.Empty;
            cachedValue = null;
            isEntryInCache = GitHubCache.TryGetValue(url, out Tuple<string, object> cachedInfo);

            if (isEntryInCache)
            {
                etag = cachedInfo.Item1;
                cachedValue = cachedInfo.Item2;
            }
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

        private string GetHeaderValue(HttpResponseMessage responseMsg, string headerName)
        {
            if (responseMsg.Headers.TryGetValues(headerName, out IEnumerable<string> values))
            {
                return values.FirstOrDefault() ?? string.Empty;
            }

            return string.Empty;
        }

    }
}


