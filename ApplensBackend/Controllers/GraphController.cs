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
    [Route("api/graph/")]
    [Authorize]
    public class GraphController: Controller
    {
        private IMemoryCache _cache;
        private readonly IGraphClientService _graphClientService;

        public GraphController(IMemoryCache cache, IGraphClientService graphClientService, IDiagnosticClientService diagnosticClient)
        {
            _cache = cache;
            _graphClientService = graphClientService;
        }

        [HttpGet("users/{userId}")]
        [HttpOptions("users/{userId}")]
        public async Task<IActionResult> GetUser(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest("userId cannot be empty");
            }

            var response = await _graphClientService.GetOrCreateUserImageAsync(userId);
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
