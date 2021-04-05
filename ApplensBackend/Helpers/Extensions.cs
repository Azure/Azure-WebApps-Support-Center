using Newtonsoft.Json;
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

        public static string Truncate(this string source, int length, bool addTruncatedIndicatorAtEnd = false)
        {
            if (source.Length > length)
            {
                source = source.Substring(0, length);
                if (addTruncatedIndicatorAtEnd)
                {
                    source = $"{source} ...";
                }
            }

            return source;
        }

        public static bool IsNullOrEmpty<T>(this IEnumerable<T> source)
        {
            return source == null || !source.Any();
        }
    }
}
