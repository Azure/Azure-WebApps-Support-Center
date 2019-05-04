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

namespace AppLensV3.Controllers
{
    [Route("api/graph/")]
    [Authorize]
    public class GraphController: Controller
    {
        private readonly IGraphClientService _graphClientService;
        private IDiagnosticClientService _diagnosticClientService { get; }

        public GraphController(IGraphClientService graphClientService, IDiagnosticClientService diagnosticClient)
        {
            _graphClientService = graphClientService;
            _diagnosticClientService = diagnosticClient;
        }

        [HttpGet("users/{userId}")]
        [HttpOptions("users/{userId}")]
        public async Task<string> GetUser(string userId)
        {
            //if (string.IsNullOrWhiteSpace(userId))
            //{
            //    return BadRequest("userId cannot be empty");
            //}

            // List<Communication> comms = await _outageService.GetCommunicationsAsync(subscriptionId, startTimeUtc, endTimeUtc);
            var res = await _graphClientService.GetUserImage(userId);
            return res;
        }

        [HttpPost("users")]
        [HttpOptions("users")]
        public async Task<IActionResult> GetUsers([FromBody]JToken body)
        {
            string[] authors = new string[] { };
            if (body != null && body["authors"] != null)
            {
                authors = body["authors"].ToObject<string[]>();
            }

            var response = await _graphClientService.GetUsers(authors);
            
            if (response != null)
            {
                return Ok(response);
            }

            return BadRequest("Bad request");
 
        }
    }
}
