using Newtonsoft.Json;
using System.Collections.Generic;

namespace AppLensV3.Models
{
    public class ResourceConfig
    {
        [JsonProperty(PropertyName = "id")]
        public string Id;

        [JsonProperty(PropertyName = "name")]
        public string Name;

        [JsonProperty(PropertyName = "resourceType")]
        public string ResourceType;

        [JsonProperty(PropertyName = "resourceOwners")]
        public List<string> ResourceOwners;

        [JsonProperty(PropertyName = "publishAccessControlEnabled")]
        public bool PublishAccessControlEnabled;

        [JsonProperty(PropertyName = "allowedUsersToPublish")]
        public List<string> AllowedUsersToPublish;

        [JsonProperty(PropertyName = "allowedGroupsToPublish")]
        public List<Group> AllowedGroupsToPublish;

        [JsonProperty(PropertyName = "PartitionKey")]
        public string PartitionKey;
    }

    public class Group
    {
        [JsonProperty(PropertyName = "name")]
        public string Name;

        [JsonProperty(PropertyName = "objectIds")]
        public string ObjectIds;
    }
}
