using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Backend.Services;

namespace Backend.Controllers
{
    [Produces("application/json")]
    [Route("api/appinsights")]
    public class AppInsightsController : Controller
    {
        private readonly IArmService _armService;
        private readonly IAppInsightsService _appInsightsService;
        private readonly ICommonService _commonService;

        public AppInsightsController(IArmService armService, IAppInsightsService appInsightsService, ICommonService commonService)
        {
            _armService = armService;
            _appInsightsService = appInsightsService;
            _commonService = commonService;
        }
        [HttpGet]
        [HttpOptions]
        public async Task<IActionResult> Invoke()
        {
            if (!_commonService.GetHeaderValue(Request.Headers, "resource-uri", out string resourceId))
            {
                return BadRequest("Missing resource-uri header");
            }
            resourceId = resourceId.ToLower();

            if (!_commonService.GetHeaderValue(Request.Headers, "authorization", out string authToken))
            {
                return BadRequest("Missing authorization header");
            }

            if (!_commonService.GetHeaderValue(Request.Headers, "appinsights-resource-uri", out string appInsightsResource))
            {
                return BadRequest("Missing appinsights-resource-uri header");
            }
            appInsightsResource = appInsightsResource.ToLower();

            if (!_commonService.GetHeaderValue(Request.Headers, "appinsights-app-id", out string appInsightsAppId))
            {
                return BadRequest("Missing appinsights-app-id header");
            }

            if (!_commonService.ValidateResourceUri(resourceId, out string subscriptionId))
            {
                return BadRequest("resource uri not in correct format.");
            }

            if (!_commonService.ValidateResourceUri(appInsightsResource, out _))
            {
                return BadRequest("appinsights-resource-uri not in correct format.");
            }

            if (!(await this._armService.CheckSubscriptionAccessAsync(subscriptionId, authToken)))
            {
                return Unauthorized();
            }

            try
            {
                var appInsightsEnabled = await this._appInsightsService.ConnectApplicationInsights(resourceId, appInsightsResource, appInsightsAppId, authToken);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

            return Ok(true);
        }
    }
}