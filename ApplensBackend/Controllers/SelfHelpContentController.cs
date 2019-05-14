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
    [Route("api/selfhelp/")]
    [Authorize]
    public class SelfHelpContentController : Controller
    {
        private IMemoryCache _cache;
        private readonly ISelfHelpContentService _selfHelpContentService;

        public SelfHelpContentController(IMemoryCache cache, ISelfHelpContentService selfHelpContentService, IDiagnosticClientService diagnosticClient)
        {
            _cache = cache;
            _selfHelpContentService = selfHelpContentService;
        }

        [HttpGet("pesId/{pesId}/supportTopicId/{supportTopicId}")]
        [HttpOptions("pesId/{pesId}/supportTopicId/{supportTopicId}")]
        public async Task<IActionResult> GetSelfHelpContent(string pesId, string supportTopicId)
        {
            if (string.IsNullOrWhiteSpace(pesId))
            {
                return BadRequest("pesId cannot be empty");
            }

            if (string.IsNullOrWhiteSpace(supportTopicId))
            {
                return BadRequest("supportTopicId cannot be empty");
            }

            var response = await _selfHelpContentService.GetSelfHelpContentAsync(pesId, supportTopicId);
            return Ok(response);
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
            return Ok(response);
        }

    }
}
