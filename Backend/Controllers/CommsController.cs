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
            if (!Request.Headers.ContainsKey("x-ms-resource") || !Request.Headers.TryGetValue("x-ms-resource", out StringValues val))
            {
                return BadRequest("Missing x-ms-resource");
            }

            if(!Request.Headers.ContainsKey("Authorization") || !Request.Headers.TryGetValue("Authorization", out StringValues authHeader))
            {
                return BadRequest("Missing Authorization Header");
            }

            string resource = val.First();
            Regex resourceRegEx = new Regex("/subscriptions/(.*)/resourcegroups/(.*)/providers/(.*)/(.*)/(.*)");
            Match match = resourceRegEx.Match(resource);
            if (!match.Success)
            {
                return BadRequest("resource uri not in correct format.");
            }

            string subscriptionId = match.Groups[1].Value;
            string authToken = authHeader.First();

            if(!(await this._armService.CheckSubscriptionAccessAsync(subscriptionId, authToken)))
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