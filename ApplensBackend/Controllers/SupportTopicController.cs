using AppLensV3.Helpers;
using AppLensV3.Models;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3.Controllers
{
    public class SupportTopicController: ControllerBase
    {
        private readonly ISupportTopicService _supportTopicService;

        public SupportTopicController(ISupportTopicService supportTopicService)
        {
            _supportTopicService = supportTopicService;
        }

        [HttpGet("supporttopics/{pesId}")]
        [HttpOptions("supporttopics/{pesId}")]
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

           // List<Communication> comms = await _outageService.GetCommunicationsAsync(subscriptionId, startTimeUtc, endTimeUtc);
            return Ok();
        }
    }
}
