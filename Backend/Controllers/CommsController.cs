using Backend.Helpers;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Produces("application/json")]
    [Route("api/comms")]
    [ResponseCache(CacheProfileName = "Default")]
    public class CommsController : Controller
    {
        private readonly IOutageCommunicationService _outageService;
        private readonly IArmService _armService;

        public CommsController(IOutageCommunicationService outageService, IArmService armService)
        {
            this._outageService = outageService;
            this._armService = armService;
        }

        [HttpGet]
        [HttpOptions]
        public async Task<IActionResult> Invoke(string startTime = null, string endTime = null)
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
            if (!Utility.ValidateResourceUri(resourceId, out string subscriptionId))
            {
                return BadRequest("resource uri not in correct format.");
            }

            if (!(await this._armService.CheckSubscriptionAccessAsync(subscriptionId, authToken)))
            {
                return Unauthorized();
            }

            if (!DateTimeHelper.PrepareStartEndTimeWithTimeGrain(startTime, endTime, string.Empty, 30, out DateTime startTimeUtc, out DateTime endTimeUtc, out TimeSpan timeGrainTimeSpan, out string errorMessage))
            {
                return BadRequest(errorMessage);
            }

            List<Communication> comms = await this._outageService.GetCommunicationsAsync(subscriptionId, startTimeUtc, endTimeUtc);
            return Ok(comms);
        }
    }
}