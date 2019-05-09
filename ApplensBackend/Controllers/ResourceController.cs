using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace AppLensV3
{
    [Authorize]
    public class ResourceController : Controller
    {
        IDiagnosticClientService _diagnosticService;

        public ResourceController(IDiagnosticClientService diagnosticService) {
            _diagnosticService = diagnosticService;
        }

        [HttpGet("api/sites/{siteName}")]
        [HttpOptions("api/sites/{siteName}")]
        public async Task<IActionResult> GetSite(string siteName)
        {
            return await GetSiteInternal(null, siteName);
        }

        [HttpGet]
        [Route("api/stamps/{stamp}/sites/{siteName}")]
        public async Task<IActionResult> GetSite(string stamp, string siteName)
        {
            return await GetSiteInternal(stamp, siteName);
        }

        [HttpGet("api/hostingEnvironments/{hostingEnvironmentName}")]
        [HttpOptions("api/hostingEnvironments/{hostingEnvironmentName}")]
        public async Task<IActionResult> GetHostingEnvironmentDetails(string hostingEnvironmentName)
        {
            var hostingEnvironmentDetails = await _diagnosticService.Execute(HttpMethod.Get.Method, $"hostingEnvironments/{hostingEnvironmentName}");
            var contentJson = await hostingEnvironmentDetails.Content.ReadAsStringAsync();
            var content = JsonConvert.DeserializeObject(contentJson);

            var details = new { Details = content };

            if (hostingEnvironmentDetails.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(details);
            }

            return Ok(details);
        }

        private async Task<IActionResult> GetSiteInternal(string stamp, string siteName)
        {
            var path = stamp != null ? $"stamps/{stamp}/sites/{siteName}" : $"sites/{siteName}";
            var siteDetailsResponse = await _diagnosticService.Execute(HttpMethod.Get.Method, path);
            var contentJson = await siteDetailsResponse.Content.ReadAsStringAsync();
            var content = JsonConvert.DeserializeObject(contentJson);

            var details = new
            {
                SiteName = siteName,
                Details = content,
            };

            return StatusCode((int)siteDetailsResponse.StatusCode, details);
        }
    }
}
