using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Auth;
using Microsoft.WindowsAzure.Storage.Blob;
using Octokit;

namespace AppLensV3
{
    /// <summary>
    /// This is a facade of a GitHubClient service that in actually routes requests to an Azure Storage Account.
    /// </summary>
    public class AzureStorageDetectorClientService : IGithubClientService
    {
        private static CloudBlobContainer _detectorsRepository;
        private string _blobContainerName;

        public AzureStorageDetectorClientService(IConfiguration configuration)
        {
            const string sasTokenConfigName = "AzureStorage:Key";
            const string accountNameConfigName = "AzureStorage:AccountName";
            const string endpointSuffixConfigName = "AzureStorage:EndPointSuffix";
            const string blobContainerName = "AzureStorage:Detectors:BlobContainer";
            var configurationNames = new string[] { sasTokenConfigName, accountNameConfigName, endpointSuffixConfigName, blobContainerName };

            foreach (var configName in configurationNames)
            {
                if (string.IsNullOrWhiteSpace(configuration.GetValue<string>(configName, null)))
                {
                    throw new ArgumentNullException(configName);
                }
            }

            var storageCredentials = new StorageCredentials(configuration.GetValue<string>(accountNameConfigName), configuration.GetValue<string>(sasTokenConfigName));
            var storageAccount = new CloudStorageAccount(storageCredentials, configuration.GetValue<string>(accountNameConfigName), configuration.GetValue<string>(endpointSuffixConfigName), true);
            _blobContainerName = configuration.GetValue<string>(blobContainerName);
            _detectorsRepository = storageAccount.CreateCloudBlobClient().GetContainerReference(_blobContainerName);
        }

        public Task<List<Models.Commit>> GetAllCommits(string filePath)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<string>> GetChangedFiles(string sha)
        {
            throw new NotImplementedException();
        }

        public async Task<string> GetCommitContent(string filePath, string sha)
        {
            return await GetBlobByName(filePath);
        }

        public async Task<string> GetConfiguration(string id)
        {
            return await GetBlobByName($"{id.ToLower()}/package.json");
        }

        public async Task<string> GetMetadataFile(string id)
        {
            return await GetBlobByName($"{id.ToLower()}/metadata.json");
        }

        public Task<string> GetRawFile(string url)
        {
            throw new NotImplementedException();
        }

        public Task<string> GetResourceConfigFile()
        {
            throw new NotImplementedException();
        }

        public async Task<string> GetSourceFile(string id)
        {
            return await GetBlobByName($"{id.ToLower()}/{id.ToLower()}.csx");
        }

        private async Task<string> GetBlobByName(string name)
        {
            Trace.WriteLine($"Find and download blob {name}");

            var cloudBlob = _detectorsRepository.GetBlockBlobReference(name);
            string blobContent = await cloudBlob.DownloadTextAsync();
            return blobContent;
        }
    }
}
