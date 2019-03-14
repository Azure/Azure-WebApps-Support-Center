// <copyright file="LocalDevelopmentClientService.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AppLensV3
{
    /// <summary>
    /// Local development client service.
    /// </summary>
    public class LocalDevelopmentClientService : ILocalDevelopmentClientService
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="LocalDevelopmentClientService"/> class.
        /// </summary>
        /// <param name="configuration">Service configuration.</param>
        public LocalDevelopmentClientService(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        /// <summary>
        /// Gets storage configuration.
        /// </summary>
        public string StorageConnectionString
        {
            get
            {
                return Configuration["LocalDevelopment:connectionString"];
            }
        }

        private IConfiguration Configuration { get; }

        /// <summary>
        /// Prepare local development.
        /// </summary>
        /// <param name="detectorId">Detector id.</param>
        /// <param name="scriptBody">Script body.</param>
        /// <param name="resourceId">Resource id.</param>
        /// <param name="config">Package configuration.</param>
        /// <param name="baseUrl">Base URL.</param>
        /// <param name="gists">Gist lists.</param>
        /// <param name="sourceReference">Source reference.</param>
        /// <returns>Task for preparing local development.</returns>
        public async Task<string> PrepareLocalDevelopment(string detectorId, string scriptBody = null, string resourceId = null, string config = null, Uri baseUrl = null, IDictionary<string, IEnumerable<string>> gists = null, IDictionary<string, string> sourceReference = null)
        {
            try
            {
                var assemPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
                var csxFilePath = Path.Combine(assemPath, @"LocalDevelopmentTemplate\Detector\detector.csx");
                var packageJson = Path.Combine(assemPath, @"LocalDevelopmentTemplate\Detector\package.txt");
                var gistsPath = Path.Combine(assemPath, @"LocalDevelopmentTemplate\Detector\gists\");

                if (!Directory.Exists(gistsPath))
                {
                    Directory.CreateDirectory(gistsPath);
                }

                // Write script body into template detector.csx
                File.WriteAllText(csxFilePath, scriptBody);

                // Prepare ResourceId
                var settingsJson = File.ReadAllText(packageJson);
                dynamic settingsJsonObject = JsonConvert.DeserializeObject(settingsJson);

                settingsJsonObject["ResourceId"] = resourceId;

                foreach (var p in sourceReference)
                {
                    var path = Path.Combine(gistsPath, $"{p.Key}.csx");
                    File.WriteAllText(path, p.Value);
                }

                var configuration = new JObject
                {
                    ["detectorSettings"] = settingsJsonObject,
                    ["packageDefinition"] = JObject.FromObject(JsonConvert.DeserializeObject(config)),
                    ["gistDefinitions"] = JObject.FromObject(PrepareGistDefinition(new Uri(baseUrl, resourceId), gists))
                };

                File.WriteAllText(packageJson, JsonConvert.SerializeObject(configuration, Formatting.Indented));

                var zipSource = Path.Combine(assemPath, @"LocalDevelopmentTemplate");
                var zipfileName = detectorId + @".zip";
                var zipDest = Path.Combine(assemPath, zipfileName);

                // Delete the zipDest first to avoid exception from creation
                File.Delete(zipDest);
                ZipFile.CreateFromDirectory(zipSource, zipDest);

                var zipFile = new FileInfo(zipDest);

                // Overwrite the package.json.
                File.WriteAllText(packageJson, settingsJson);

                Directory.Delete(gistsPath, true);

                // Storage accounts: detectorlocaldev
                return await UploadToBlobStorage(zipFile, StorageConnectionString, "detectordevelopment");
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                throw;
            }
        }

        private static async Task CreateSharedAccessPolicy(CloudBlobContainer container, string policyName)
        {
            var permissions = await container.GetPermissionsAsync();

            var sharedPolicy = new SharedAccessBlobPolicy()
            {
                SharedAccessExpiryTime = DateTimeOffset.UtcNow.AddYears(10),
                Permissions = SharedAccessBlobPermissions.Write | SharedAccessBlobPermissions.Read
            };

            permissions.SharedAccessPolicies.Add(policyName, sharedPolicy);
            await container.SetPermissionsAsync(permissions);
        }

        private static async Task<string> UploadToBlobStorage(FileInfo zipFile, string storageConnectionString, string blobContainerName)
        {
            // Connect to the storage account's blob endpoint
            var blobUri = "";

            if (CloudStorageAccount.TryParse(storageConnectionString, out CloudStorageAccount account))
            {
                try
                {
                    var client = account.CreateCloudBlobClient();

                    // Create the blob container
                    var container = client.GetContainerReference(blobContainerName);
                    await container.CreateIfNotExistsAsync();

                    // Clear all public permissions for container
                    var permissions = await container.GetPermissionsAsync();
                    permissions.SharedAccessPolicies.Clear();
                    permissions.PublicAccess = BlobContainerPublicAccessType.Off;
                    await container.SetPermissionsAsync(permissions);

                    // Create a shared access policy
                    var sharedAcessPolicyName = "localDevPolicy";
                    await CreateSharedAccessPolicy(container, sharedAcessPolicyName);

                    // Upload the zip and store it in the blob
                    var blob = container.GetBlockBlobReference(zipFile.Name);
                    using (FileStream fs = zipFile.OpenRead())
                    {
                       await blob.UploadFromStreamAsync(fs);
                    }

                    // Get the uri string for the container, including the SAS token
                    string sasBlobToken = blob.GetSharedAccessSignature(null, sharedAcessPolicyName);
                    blobUri = blob.Uri + sasBlobToken;
                }
                catch (StorageException ex)
                {
                    Console.WriteLine("Error returned from the service: {0}", ex.Message);
                    throw ex;
                }
            }
            else
            {
                Console.Error.Write("Invalid storage connection string");
            }

            return blobUri;
        }

        /// <summary>
        /// Prepare gist definition file.
        /// </summary>
        /// <param name="host">Applens host name.</param>
        /// <param name="gists">Gist list.</param>
        /// <returns>Gist definition file.</returns>
        private object PrepareGistDefinition(Uri host, IDictionary<string, IEnumerable<string>> gists)
        {
            var def = new Dictionary<string, Dictionary<string, string>>();

            foreach (var p in gists)
            {
                var tmp = new Dictionary<string, string>();
                foreach (var commit in p.Value)
                {
                    tmp.Add(commit, $"{host}/gists/{p.Key}/changelist/{commit}");
                }

                def.Add(p.Key, tmp);
            }

            return def;
        }
    }
}