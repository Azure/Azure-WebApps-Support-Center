using System;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

namespace Backend.Helpers
{
    public class Utility
    {
        public static bool TryGetHeaderValue(IHeaderDictionary headers, string headerName, out string headerValue)
        {
            headerValue = "";
            string actualHeaderName = headers.Keys.FirstOrDefault(p => p.Equals(headerName, StringComparison.OrdinalIgnoreCase));
            if (string.IsNullOrWhiteSpace(actualHeaderName) || !headers.TryGetValue(actualHeaderName, out StringValues val))
            {
                return false;
            }
            headerValue = val.First();
            return true;
        }

        public static bool ValidateResourceUri(string resourceId, out string subscriptionId)
        {
            subscriptionId = string.Empty;
            Regex resourceRegEx = new Regex("/subscriptions/(.*)/resourcegroups/(.*)/providers/(.*)/(.*)/(.*)");
            Match match = resourceRegEx.Match(resourceId);
            if (match.Success)
            {
                subscriptionId = match.Groups[1].Value;
            }
            return match.Success;
        }
    }
}
