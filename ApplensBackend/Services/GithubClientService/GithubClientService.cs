using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Models;
using Microsoft.Extensions.Configuration;
using Octokit;

namespace AppLensV3
{
    public class GithubClientService : IGithubClientService
    {
        private ConcurrentDictionary<string, Tuple<string, object>> _gitHubCache;
        private HttpClient _httpClient;
        private GitHubClient _octokitClient;
        private string _userName;
        private string _repoName;
        private string _branch;
        private string _accessToken;

        public GithubClientService(IConfiguration configuration)
        {
            InitializeHttpClient();
            _gitHubCache = new ConcurrentDictionary<string, Tuple<string, object>>();
            _userName = configuration["Github:UserName"];
            _repoName = configuration["Github:RepoName"];
            _branch = configuration["Github:Branch"];
            _accessToken = configuration["Github:AccessToken"];

            _octokitClient = new GitHubClient(new Octokit.ProductHeaderValue(_userName))
            {
                Credentials = new Credentials(_accessToken)
            };
        }

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

            response.EnsureSuccessStatusCode();
            cachedValue = await response.Content.ReadAsStringAsync();
            etag = GetHeaderValue(response, "ETag").Replace("W/", string.Empty);
            Tuple<string, object> cachedInfo = new Tuple<string, object>(etag, cachedValue);
            _gitHubCache.AddOrUpdate(url, cachedInfo, (key, oldvalue) => cachedInfo);

            return cachedValue.ToString();
        }

        public async Task<GithubEntry> Get(string url)
        {
            TryGetETAGAndCacheValue(url, out string etag, out object cachedValue, out bool isEntryInCache);
            HttpResponseMessage response = await GetInternal(url, etag);
            if (response.StatusCode == HttpStatusCode.NotModified)
            {
                if (isEntryInCache)
                {
                    return (GithubEntry)cachedValue;
                }

                throw new Exception($"url content not found in cache : {url}");
                // TODO : If entry is not in cache for some reason, we need to fetch it again from github without etag header to refresh the cache
            }

            response.EnsureSuccessStatusCode();
            cachedValue = await response.Content.ReadAsAsyncCustom<GithubEntry>();
            etag = GetHeaderValue(response, "ETag").Replace("W/", string.Empty);
            Tuple<string, object> cachedInfo = new Tuple<string, object>(etag, cachedValue);
            _gitHubCache.AddOrUpdate(url, cachedInfo, (key, oldvalue) => cachedInfo);

            return (GithubEntry)cachedValue;
        }

        public async Task Publish(Package pkg)
        {
            if (pkg == null || string.IsNullOrWhiteSpace(pkg.Id)) return;

            string detectorFilePath = $"{pkg.Id.ToLower()}/{pkg.Id.ToLower()}";

            string csxFilePath = $"{detectorFilePath}.csx";
            string dllFilePath = $"{detectorFilePath}.dll";
            string pdbFilePath = $"{detectorFilePath}.pdb";

            string commitMessage = $@"Add\Update Detector with id : {pkg.Id.ToLower()}";

            await CreateOrUpdateFile(csxFilePath, pkg.CodeString, commitMessage);
            await CreateOrUpdateFile(dllFilePath, pkg.DllBytes, commitMessage, false);
            await CreateOrUpdateFile(pdbFilePath, pkg.PdbBytes, commitMessage, false);
        }

        public async Task<string> GetDetectorFile(string detectorId)
        {
            if (string.IsNullOrWhiteSpace(detectorId))
            {
                throw new ArgumentNullException("detectorId");
            }

            string detectorFileUrl = string.Format(
                GithubConstants.DetectorFilePathFormat,
                _userName,
                _repoName,
                detectorId,
                _branch,
                _accessToken);

            return await GetRawFile(detectorFileUrl);
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

            HttpResponseMessage response = await _httpClient.SendAsync(request);

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
            isEntryInCache = _gitHubCache.TryGetValue(url, out Tuple<string, object> cachedInfo);

            if (isEntryInCache)
            {
                etag = cachedInfo.Item1.ToString();
                cachedValue = cachedInfo.Item2;
            }
        }

        private void InitializeHttpClient()
        {
            _httpClient = new HttpClient
            {
                MaxResponseContentBufferSize = Int32.MaxValue,
                Timeout = TimeSpan.FromSeconds(30)
            };

            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "applensv3");
        }

        private string GetHeaderValue(HttpResponseMessage responseMsg, string headerName)
        {
            if (responseMsg.Headers.TryGetValues(headerName, out IEnumerable<string> values))
            {
                return values.FirstOrDefault() ?? string.Empty;
            }

            return string.Empty;
        }

        public async Task<string> GetCommitContent(string detectorId, string sha)
        {
            try
            {
                string filePath = $"{detectorId.ToLower()}/{detectorId.ToLower()}.csx";
                CommitRequest request = new CommitRequest
                {
                    Path = filePath,
                    Sha = _branch
                };

                var commitContent = await _octokitClient.Repository.Content.GetAllContentsByRef(_userName, _repoName, filePath, sha);
                return commitContent?[0].Content;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<List<DetectorCommit>> GetAllCommits(string detectorId)
        {
            try
            {
                string filePath = $"{detectorId.ToLower()}/{detectorId.ToLower()}.csx";
                CommitRequest request = new CommitRequest
                {
                    Path = filePath,
                    Sha = _branch
                };

                var allCommits = await _octokitClient.Repository.Commit.GetAll(_userName, _repoName, request);
                List<DetectorCommit> detectorCommits = new List<DetectorCommit>();

                var commits = allCommits.Select(p => new Tuple<string, DateTimeOffset, string>(p.Sha, p.Commit.Committer.Date, p.Commit.Message)).OrderByDescending(o => o.Item2);

                String previousSha = String.Empty;
                String currentSha = String.Empty;

                for (int i = commits.Count() - 1; i >= 0; i--)
                {
                    var commit = commits.ElementAt(i);
                    previousSha = currentSha;
                    currentSha = commit.Item1;

                    if (commit.Item3.Contains("CommittedBy"))
                    {
                        string author = commit.Item3.Split(new string[] { "CommittedBy :" }, StringSplitOptions.RemoveEmptyEntries).Last();
                        author = author.Replace("@microsoft.com", "", StringComparison.OrdinalIgnoreCase);
                        string date = commit.Item2.ToString().Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).First();
                        detectorCommits.Add(new DetectorCommit(currentSha, author, date, previousSha));
                    }
                }
                return detectorCommits;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        private async Task<Tuple<string, string>> GetDetectorFilesDiff(string detectorId, string currentSha, string previousSha)
        {
            string filePath = $"{detectorId.ToLower()}/{detectorId.ToLower()}.csx";
            var currentFileObjectTask = _octokitClient.Repository.Content.GetAllContentsByRef(_userName, _repoName, filePath, currentSha);
            var previousFileContentTask = _octokitClient.Repository.Content.GetAllContentsByRef(_userName, _repoName, filePath, currentSha);
            var currentFileObject = await currentFileObjectTask;
            var previousFileObject = await previousFileContentTask;

            return new Tuple<string, string>(currentFileObject?[0].Content, previousFileObject?[0].Content);
        }

        private async Task CreateOrUpdateFile(string filePath, string content, string commitMessage, bool convertContentToBase64 = true)
        {
            try
            {
                // try to get the file (and with the file the last commit sha)
                var existingFile = await _octokitClient.Repository.Content.GetAllContentsByRef(_userName, _repoName, filePath, _branch);

                // update the file
                var updateChangeSet = await _octokitClient.Repository.Content.UpdateFile(_userName, _repoName, filePath,
                   new UpdateFileRequest(commitMessage, content, existingFile.First().Sha, _branch, convertContentToBase64));
            }
            catch (Octokit.NotFoundException)
            {
                var createFileRequest = new CreateFileRequest(commitMessage, content, _branch, convertContentToBase64);
                // if file is not found, create it
                var createChangeSet = await _octokitClient.Repository.Content.CreateFile(_userName, _repoName, filePath,
                    createFileRequest);
            }
        }
    }
}
