using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class CommonService : ICommonService
    {
        public bool GetHeaderValue(IHeaderDictionary headers, string headerName, out string headerValue)
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

        public bool ValidateResourceUri(string resourceId, out string subscriptionId)
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
