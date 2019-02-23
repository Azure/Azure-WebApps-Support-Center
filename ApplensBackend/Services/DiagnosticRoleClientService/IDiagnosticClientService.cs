using System.Net.Http;
using System.Threading.Tasks;
using AppLensV3.Models;
namespace AppLensV3
{
    public interface IDiagnosticClientService
    {
        Task<HttpResponseMessage> Execute(string method, string path, string body = null, bool internalView = true, CompilationParameters compilationParameters = null);
    }
}