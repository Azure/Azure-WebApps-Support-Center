using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;

namespace AppLensV3
{
    public interface IDiagnosticClientService
    {
         Task<HttpResponseMessage> Execute(string method, string path, string body = null, bool internalView = true);
    }
}