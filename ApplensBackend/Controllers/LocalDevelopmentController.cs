// <copyright file="LocalDevelopmentController.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// Local development controller.
    /// </summary>
    [Route("api")]
    [Authorize]
    public class LocalDevelopmentController : Controller
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="LocalDevelopmentController"/> class.
        /// </summary>
        /// <param name="localDevelopmentClient">Local development client.</param>
        /// <param name="githubClientService">Github client.</param>
        public LocalDevelopmentController(ILocalDevelopmentClientService localDevelopmentClient, IGithubClientService githubClientService)
        {
            LocalDevelopmentClient = localDevelopmentClient;
            GithubClient = githubClientService;
        }

        private ILocalDevelopmentClientService LocalDevelopmentClient { get; }

        private IGithubClientService GithubClient { get; }

        /// <summary>
        /// Prepare local development environment.
        /// </summary>
        /// <param name="detectorId">Detector id.</param>
        /// <param name="body">Post body.</param>
        /// <returns>Task for preparing local development environment.</returns>
        [HttpPost("localdev")]
        public async Task<IActionResult> PrepareLocalDevEnvironementstring(string detectorId, [FromBody]JToken body)
        {
            var scriptBody = string.Empty;
            var resourceId = string.Empty;

            if (Request.Headers.ContainsKey("x-ms-path-query"))
            {
                resourceId = Request.Headers["x-ms-path-query"];
            }

            if (body == null || body["baseUrl"] == null)
            {
                return BadRequest();
            }

            if (body["script"] != null)
            {
                scriptBody = body["script"].ToString();
            }

            var gists = new List<string>();
            if (body["gists"] != null)
            {
                gists = body["gists"].ToObject<List<string>>();
            }

            var gistDef = new Dictionary<string, IEnumerable<string>>();
            foreach (var gist in gists)
            {
                var commits = await GithubClient.GetAllCommits(gist);
                var all = new List<string>();
                commits.ForEach(c => all.Add(c.Sha));
                gistDef.Add(gist, all);
            }

            var config = string.Empty;
            var sourceReference = new Dictionary<string, string>();
            if (body["configuration"] != null)
            {
                config = body["configuration"].ToString();
                var dependencies = body["configuration"]["dependencies"].ToObject<Dictionary<string, string>>();
                foreach (var p in dependencies)
                {
                    sourceReference.Add(p.Key.ToLower(), await GithubClient.GetCommitContent(p.Key.ToLower(), p.Value));
                }
            }

            var baseUrl = new Uri(body["baseUrl"].ToString());

            string zipBlobUri = await LocalDevelopmentClient.PrepareLocalDevelopment(detectorId, scriptBody?.ToString(), resourceId, config, baseUrl, gistDef, sourceReference);
            return Ok(zipBlobUri);
        }
    }
}
