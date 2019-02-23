using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Authorization;
using AppLensV3.Models;
namespace AppLensV3.Controllers
{
    [Route("api")]
    [Authorize]
    public class DiagnosticController : Controller
    {
        IDiagnosticClientService _diagnosticClient;

        public DiagnosticController(IDiagnosticClientService diagnosticClient)
        {
            this._diagnosticClient = diagnosticClient;
        }

        [HttpPost("invoke")]
        [HttpOptions("invoke")]
        public async Task<IActionResult> Invoke([FromBody]JToken body)
        {
            if (!Request.Headers.ContainsKey("x-ms-path-query"))
            {
                return BadRequest("Missing x-ms-path-query header");
            }

            string path = Request.Headers["x-ms-path-query"];

            string method = HttpMethod.Get.Method;
            if (Request.Headers.ContainsKey("x-ms-method"))
            {
                method = Request.Headers["x-ms-method"];
            }

            bool internalView = true;
            if (Request.Headers.ContainsKey("x-ms-internal-view"))
            {
                bool.TryParse(Request.Headers["x-ms-internal-view"], out internalView);
            }

            string scriptETag = "";

            if (Request.Headers.ContainsKey("script-etag"))
            {
                scriptETag = Request.Headers["script-etag"];
            }

            string assemblyName = "";

            if(Request.Headers.ContainsKey("assembly-name"))
            {
                assemblyName = Request.Headers["assembly-name"];
            }
            var response = await this._diagnosticClient.Execute(method, path, body?.ToString(), internalView, new CompilationParameters
            {
                ScriptETag = scriptETag,
                AssemblyName = assemblyName
            });

            if (response != null)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                if (response.IsSuccessStatusCode)
                {
                    var responseObject = JsonConvert.DeserializeObject(responseString);
                    return Ok(responseObject);
                }
                else if(response.StatusCode == HttpStatusCode.BadRequest)
                {
                    return BadRequest(responseString);
                }
            }

            return StatusCode((int)response.StatusCode);
        }
    }
}
