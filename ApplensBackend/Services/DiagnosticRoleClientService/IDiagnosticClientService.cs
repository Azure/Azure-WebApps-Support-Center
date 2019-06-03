using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace AppLensV3
{
    public interface IDiagnosticClientService
    {
        Task<HttpResponseMessage> Execute(string method, string path, string body = null, bool internalClient = true, bool internalView = true, HttpRequestHeaders additionalHeaders = null);
    }
}