using Microsoft.AspNetCore.Http;

namespace Backend.Services
{
    public interface ICommonService
    {
        bool GetHeaderValue(IHeaderDictionary headers, string headerName, out string headerValue);

        bool ValidateResourceUri(string resourceId, out string subscriptionId);

    }
}
