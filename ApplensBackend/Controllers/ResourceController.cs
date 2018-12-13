using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace AppLensV3
{
    [Authorize]
    public class ResourceController : Controller
    {
        IObserverClientService _observerService;

        public ResourceController(IObserverClientService observerService) {
            _observerService = observerService;
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

        [HttpGet]
        [Route("api/stamps/{stamp}/sites/{siteName}/postBody")]
        public async Task<IActionResult> GetSiteRequestBody(string stamp, string siteName)
        {
            var sitePostBody = await _observerService.GetSitePostBody(stamp, siteName);

            return Ok(new { Details = sitePostBody.Content });
        }

        [HttpGet]
        [Route("api/hostingEnvironments/{hostingEnvironmentName}/postBody")]
        public async Task<IActionResult> GetHostingEnvironmentRequestBody(string hostingEnvironmentName)
        {
            var hostingEnvironmentPostBody = await _observerService.GetHostingEnvironmentPostBody(hostingEnvironmentName);

            return Ok(new { Details = hostingEnvironmentPostBody.Content });
        }

        [HttpGet("api/hostingEnvironments/{hostingEnvironmentName}")]
        [HttpOptions("api/hostingEnvironments/{hostingEnvironmentName}")]
        public async Task<IActionResult> GetHostingEnvironmentDetails(string hostingEnvironmentName)
        {
            var hostingEnvironmentDetails = await _observerService.GetHostingEnvironmentDetails(hostingEnvironmentName);

            var details = new { Details = hostingEnvironmentDetails.Content };

            if (hostingEnvironmentDetails.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(details);
            }

            return Ok(details);
        }

        private async Task<IActionResult> GetSiteInternal(string stamp, string siteName)
        {
            var hostnamesTask = _observerService.GetHostnames(siteName);
            var siteDetailsTask = stamp == null ? _observerService.GetSite(siteName) : _observerService.GetSite(stamp, siteName);

            var hostNameResponse = await hostnamesTask;
            var siteDetailsResponse = await siteDetailsTask;

            var details = new
            {
                SiteName = siteName,
                Details = siteDetailsResponse.Content,
                HostNames = hostNameResponse.Content
            };

            if (siteDetailsResponse.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(details);
            }
            
            return Ok(details);
        }
    }
}
