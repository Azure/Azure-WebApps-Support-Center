using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using System.Web;
using Microsoft.Extensions.Configuration;
using System.Security.Authentication;
using Newtonsoft.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Text.RegularExpressions;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using Microsoft.WindowsAzure;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Auth;
using Microsoft.WindowsAzure.Storage.Blob;

namespace AppLensV3
{
    public class LocalDevelopmentClientService: ILocalDevelopmentClientService
    {
        private IConfiguration _configuration;

        public string StorageConnectionString
        {
            get
            {
                return _configuration["LocalDevelopment:connectionString"];
            }
        }

        public LocalDevelopmentClientService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<string> PrepareLocalDevelopment(string detectorId, string scriptBody = null, string resourceId = null)
        {
            try
            {
                string assemPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
                string csxFilePath = Path.Combine(assemPath, @"LocalDevelopmentTemplate\Detector\detector.csx");
                string settingsPath = Path.Combine(assemPath, @"LocalDevelopmentTemplate\Detector\detectorSettings.txt");


                // Write script body into template detector.csx
                File.WriteAllText(csxFilePath, scriptBody);

                // Prepare ResourceId
                string settingsJson = File.ReadAllText(settingsPath);
                dynamic settingsJsonObject = JsonConvert.DeserializeObject(settingsJson);

                settingsJsonObject["ResourceId"] = resourceId;

                string output = JsonConvert.SerializeObject(settingsJsonObject, Formatting.Indented);
                File.WriteAllText(settingsPath, output);

                string zipSource = Path.Combine(assemPath, @"LocalDevelopmentTemplate");
                string zipfileName = detectorId + @".zip";
                string zipDest = Path.Combine(assemPath, zipfileName);

                // Delete the zipDest first to avoid exception from creation
                File.Delete(zipDest);
                ZipFile.CreateFromDirectory(zipSource, zipDest);

                FileInfo zipFile = new FileInfo(zipDest);
                // Storage accounts: detectorlocaldev
                String blobUri = await UploadToBlobStorage(zipFile, StorageConnectionString, "detectordevelopment");

                return blobUri;
            }
            catch(Exception ex)
            {
                Console.WriteLine(ex.Message);
                throw ex;
            }
        }

        public static async Task CreateSharedAccessPolicy (CloudBlobClient blobClient, CloudBlobContainer container, string policyName)
        {
            BlobContainerPermissions permissions = await container.GetPermissionsAsync();

            SharedAccessBlobPolicy sharedPolicy = new SharedAccessBlobPolicy()
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
            CloudStorageAccount account = null;
            string blobUri = "";

            if (CloudStorageAccount.TryParse(storageConnectionString, out account))
            {
                try
                {
                    CloudBlobClient client = account.CreateCloudBlobClient();

                    // Create the blob container
                    CloudBlobContainer container = client.GetContainerReference(blobContainerName);
                    await container.CreateIfNotExistsAsync();

                    // Clear all public permissions for container
                    BlobContainerPermissions permissions = await container.GetPermissionsAsync();
                    permissions.SharedAccessPolicies.Clear();
                    permissions.PublicAccess = BlobContainerPublicAccessType.Off;
                    await container.SetPermissionsAsync(permissions);

                    // Create a shared access policy
                    string sharedAcessPolicyName = "localDevPolicy";
                    await CreateSharedAccessPolicy(client, container, sharedAcessPolicyName);

                    // Upload the zip and store it in the blob
                    CloudBlockBlob blob = container.GetBlockBlobReference(zipFile.Name);
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
                Console.Error.Write(("Invalid storage connection string"));
            }

            return blobUri;
        }
    }
}