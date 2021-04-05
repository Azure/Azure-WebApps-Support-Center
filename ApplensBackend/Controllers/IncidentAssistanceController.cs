using System;
using System.Threading.Tasks;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using AppLensV3.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppLensV3.Services;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Caching.Memory;

namespace AppLensV3.Controllers
{
    [Route("api/icm/")]
    [Authorize(Policy = "DefaultAccess")]
    public class IncidentAssistanceController : Controller
    {
        private readonly IIncidentAssistanceService _incidentAssistanceService;

        public IncidentAssistanceController(IIncidentAssistanceService incidentAssistanceService)
        {
            _incidentAssistanceService = incidentAssistanceService;
        }

        [HttpGet("isFeatureEnabled")]
        [HttpOptions("isFeatureEnabled")]
        public async Task<IActionResult> IsFeatureEnabled()
        {
            return Ok(await _incidentAssistanceService.IsEnabled());
        }

        [HttpGet("getIncident/{incidentId}")]
        [HttpOptions("getIncident/{incidentId}")]
        public async Task<IActionResult> GetIncident(string incidentId)
        {
            if (string.IsNullOrWhiteSpace(incidentId))
            {
                return BadRequest("incidentId cannot be empty");
            }

            var response = await _incidentAssistanceService.GetIncidentInfo(incidentId);
            var responseTask = response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, await responseTask);
        }

        [HttpPost("validateAndUpdateIncident")]
        [HttpOptions("validateAndUpdateIncident")]
        public async Task<IActionResult> ValidateAndUpdateIncident([FromBody] JToken body, string update)
        {
            string incidentId = null;
            if (body != null && body["IncidentId"] != null)
            {
                incidentId = body["IncidentId"].ToString();
            }
            if (string.IsNullOrWhiteSpace(incidentId))
            {
                return BadRequest("IncidentId cannot be empty");
            }

            var response = await _incidentAssistanceService.ValidateAndUpdateIncident(incidentId, body, update);
            var responseTask = response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, await responseTask);
        }
    }
}
