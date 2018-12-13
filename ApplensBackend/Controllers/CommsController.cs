using AppLensV3.Helpers;
using AppLensV3.Models;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3
{
    [Route("api")]
    [Authorize]
    public class CommsController : Controller
    {
        private readonly IOutageCommunicationService _outageService;

        public CommsController(IOutageCommunicationService outageService)
        {
            this._outageService = outageService;
        }

        [HttpGet("comms/{subscriptionId}")]
        [HttpOptions("comms/{subscriptionId}")]
        public async Task<IActionResult> Invoke(string subscriptionId, string startTime = null, string endTime = null, string impactedServices = null)
        {
            if (string.IsNullOrWhiteSpace(subscriptionId))
            {
                return BadRequest("subscriptionId cannot be empty");
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
