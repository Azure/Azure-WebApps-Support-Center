using System;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppLensV3.Services;

namespace AppLensV3.Controllers
{
    [Route("api/graph/")]
    [Authorize]
    public class GraphController: Controller
    {
        private readonly IGraphClientService _graphClientService;

        public GraphController(IGraphClientService graphClientService)
        {
            _graphClientService = graphClientService;
        }

        [HttpGet("users/{userId}")]
        [HttpOptions("users/{userId}")]
        public async Task<string> Invoke(string userId)
        {
            //if (string.IsNullOrWhiteSpace(userId))
            //{
            //    return BadRequest("userId cannot be empty");
            //}

            // List<Communication> comms = await _outageService.GetCommunicationsAsync(subscriptionId, startTimeUtc, endTimeUtc);
            var res = await _graphClientService.GetUserImage(userId);
            return res;
        }
    }
}
