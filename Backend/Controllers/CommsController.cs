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
            string resourceHeaderName = Request.Headers.Keys.FirstOrDefault(p => p.Equals("resource-uri", StringComparison.OrdinalIgnoreCase));
            if (string.IsNullOrWhiteSpace(resourceHeaderName) || !Request.Headers.TryGetValue(resourceHeaderName, out StringValues val))
            {
                return BadRequest("Missing resource-uri");
            }

            string authHeaderName = Request.Headers.Keys.FirstOrDefault(p => p.Equals("authorization", StringComparison.OrdinalIgnoreCase));
            if(string.IsNullOrWhiteSpace(authHeaderName) || !Request.Headers.TryGetValue(authHeaderName, out StringValues authHeader))
            {
                return BadRequest("Missing Authorization Header");
            }

            string resource = val.First().ToLower();
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