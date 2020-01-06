using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using Backend.Helpers;

namespace Backend.Controllers
{
    [Produces("application/json")]
    [Route("api/appinsights")]
    public class AppInsightsController : Controller
    {
        private readonly IArmService _armService;
        private readonly IAppInsightsService _appInsightsService;

        public AppInsightsController(IArmService armService, IAppInsightsService appInsightsService)
        {
            _armService = armService;
            _appInsightsService = appInsightsService;
        }
        [HttpPut]
        [HttpOptions]
        public async Task<IActionResult> Invoke()
        {
            if (!Utility.TryGetHeaderValue(Request.Headers, "resource-uri", out string resourceId))
            {
                return BadRequest("Missing resource-uri header");
            }
            resourceId = resourceId.ToLower();

            if (!Utility.TryGetHeaderValue(Request.Headers, "authorization", out string authToken))
            {
                return BadRequest("Missing authorization header");
            }

            if (!Utility.TryGetHeaderValue(Request.Headers, "appinsights-resource-uri", out string appInsightsResource))
            {
                return BadRequest("Missing appinsights-resource-uri header");
            }
            appInsightsResource = appInsightsResource.ToLower();

            if (!Utility.TryGetHeaderValue(Request.Headers, "appinsights-app-id", out string appInsightsAppId))
            {
                return BadRequest("Missing appinsights-app-id header");
            }

            if (!Utility.ValidateResourceUri(resourceId, out string subscriptionId))
            {
                return BadRequest("resource uri not in correct format.");
            }

            if (!Utility.ValidateResourceUri(appInsightsResource, out _))
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

        [HttpGet("validate")]
        [HttpOptions("validate")]
        public async Task<IActionResult> Validate()
        {
            if (!Utility.TryGetHeaderValue(Request.Headers, "resource-uri", out string resourceId))
            {
                return BadRequest("Missing resource-uri header");
            }

            if (!Utility.TryGetHeaderValue(Request.Headers, "authorization", out string authToken))
            {
                return BadRequest("Missing authorization header");
            }
            resourceId = resourceId.ToLower();

            if (!Utility.ValidateResourceUri(resourceId, out string subscriptionId))
            {
                return BadRequest("resource uri not in correct format.");
            }

            if (!(await this._armService.CheckSubscriptionAccessAsync(subscriptionId, authToken)))
            {
                return Unauthorized();
            }

            try
            {
                var appInsightsEnabled = await this._appInsightsService.Validate(resourceId, authToken);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }


            return Ok(true);
        }
    }
}