using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace AppLensV3.Services
{
    public class GraphCacheService
    {
        private ConcurrentDictionary<string, UserInfo> _collection;

        public GraphCacheService()
        {
            _collection = new ConcurrentDictionary<string, UserInfo>();
        }

        public void AddOrUpdate(string key, UserInfo value)
        {
            _collection.AddOrUpdate(key.ToLower(), value, (existingKey, oldValue) => value);
        }

        public IEnumerable<UserInfo> GetAll()
        {
            return _collection.Values;
        }

        public bool TryRemoveValue(string key, out UserInfo value)
        {
            return _collection.TryRemove(key.ToLower(), out value);
        }

        public bool TryGetValue(string key, out UserInfo value)
        {
            return _collection.TryGetValue(key.ToLower(), out value);
        }

        //public IEnumerable<UserInfo> GetUserInfoList(List<string> usernames)
        //{
        //    IEnumerable<UserInfo> list = GetAll();

        //    if (list == null || !list.Any()) return list;

        //    list = list.Where(item => ((item.SystemFilter == null) && (item.ResourceFilter != null) && (item.ResourceFilter.ResourceType & context.OperationContext.Resource.ResourceType) > 0) && (context.ClientIsInternal || !item.ResourceFilter.InternalOnly));
        //    List<UserInfo> filteredList = new List<UserInfo>();

        //    List<Task> tasks = new List<Task>();
        //    usernames.ForEach(username =>
        //    {
        //        if (!TryGetValue(username, out UserInfo userInfo))
        //        {
        //            tasks.Add(Task.Run(async () =>
        //            {
        //                HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);

        //                string content = String.Empty;

        //                // If the status code is 404 NotFound, it might because the user doesn't have a profile picture, or the user alias is invalid.
        //                // We set the image string to be empty if the response is not successful
        //                if (responseMsg.IsSuccessStatusCode)
        //                {
        //                    content = Convert.ToBase64String(await responseMsg.Content.ReadAsByteArrayAsync());
        //                    //content = String.Concat("data:image / jpeg; base64,", imageBase64String);
        //                }

        //                authorsDictionary.AddOrUpdate(user, content, (k, v) => content);
        //            }));
        //        }
        //    });
        //    list.ToList().ForEach(item =>
        //    {
        //        if (context.OperationContext.Resource.IsApplicable(item.ResourceFilter))
        //        {
        //            filteredList.Add(item);
        //        }
        //    });

        //    return filteredList.OrderBy(p => p.EntryPointDefinitionAttribute.Name);
        //}

        public UserInfo GetUserInfo(string username)
        {
            if (!TryGetValue(username, out UserInfo userInfo))
            {
                return null;
            }

            return userInfo;
        }

    }
}
