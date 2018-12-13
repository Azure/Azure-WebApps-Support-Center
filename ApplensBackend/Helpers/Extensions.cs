using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace AppLensV3
{
    public static class Extensions
    {
        public static async Task<T> ReadAsAsyncCustom<T>(this HttpContent value)
        {
            string responseString = await value.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<T>(responseString);
        }
    }
}
