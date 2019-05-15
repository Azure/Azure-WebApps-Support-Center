﻿using System;
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

        [HttpGet("pesId/{pesId}/supportTopicId/{supportTopicId}/path/{path}")]
        [HttpOptions("pesId/{pesId}/supportTopicId/{supportTopicId}/path/{path}")]
        public async Task<IActionResult> GetSelfHelpContent(string pesId, string supportTopicId, string path)
        {
            if (string.IsNullOrWhiteSpace(pesId))
            {
                return BadRequest("pesId cannot be empty");
            }

            if (string.IsNullOrWhiteSpace(supportTopicId))
            {
                return BadRequest("supportTopicId cannot be empty");
            }

            if (string.IsNullOrWhiteSpace(path))
            {
                return BadRequest("path cannot be empty");
            }

            var response = await _selfHelpContentService.GetSelfHelpBySupportTopic(pesId, supportTopicId, path);

          //  var response1 = await _selfHelpContentService.GetAllSelfHelp();
            return Ok(response);
        }

        //[HttpPost("users")]
        //[HttpOptions("users")]
        //public async Task<IActionResult> GetUsers([FromBody]JToken body)
        //{
        //    string[] authors = new string[] { };
        //    if (body != null && body["authors"] != null)
        //    {
        //        authors = body["authors"].ToObject<string[]>();
        //    }

        //    var response = await _graphClientService.GetUsers(authors);
        //    return Ok(response);
        //}

    }
}
