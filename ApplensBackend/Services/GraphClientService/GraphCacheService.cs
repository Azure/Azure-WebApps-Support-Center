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
