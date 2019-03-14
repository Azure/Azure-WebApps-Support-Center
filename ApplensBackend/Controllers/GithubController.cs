// <copyright file="GithubController.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// Github controller.
    /// </summary>
    [Produces("application/json")]
    [Route("api/github")]
    [Authorize]
    public class GithubController : Controller
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="GithubController"/> class.
        /// </summary>
        /// <param name="githubService">Github service.</param>
        public GithubController(IGithubClientService githubService)
        {
            GithubService = githubService;
        }

        /// <summary>
        /// Gets github service.
        /// </summary>
        private IGithubClientService GithubService { get; }

        /// <summary>
        /// Get template.
        /// </summary>
        /// <param name="name">File name.</param>
        /// <returns>Task for getting template.</returns>
        [HttpGet("template/{name}")]
        public async Task<IActionResult> GetTemplate(string name)
        {
            string content = await GithubService.GetRawFile(GithubConstants.TemplatePath.Replace("{filename}", name));
            return Ok(content);
        }

        /// <summary>
        /// Get package configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting configuration.</returns>
        [HttpGet("package/{id}/configuration")]
        public async Task<IActionResult> GetConfiguration(string id)
        {
            try
            {
                var conf = await GithubService.GetConfiguration(id);
                return Ok(conf);
            }
            catch (Exception)
            {
                // To be compatible with current package.
                return Ok(string.Empty);
            }
        }

        /// <summary>
        /// Get source file.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting source file.</returns>
        [HttpGet("package/{id}")]
        public async Task<IActionResult> GetSourceFile(string id)
        {
            string content = await GithubService.GetSourceFile(id);
            return Ok(content);
        }

        /// <summary>
        /// Get change list.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting change list.</returns>
        [HttpGet("package/{id}/changelist")]
        public async Task<IActionResult> GetChangelist(string id)
        {
            var changelist = await GithubService.GetAllCommits(id);
            return Ok(changelist);
        }

        /// <summary>
        /// Get commit content.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit content.</returns>
        [HttpGet("package/{id}/commit/{sha}")]
        public async Task<IActionResult> GetCommitContent(string id, string sha)
        {
            var changelist = await GithubService.GetCommitContent(id, sha);
            return Ok(changelist);
        }

        /// <summary>
        /// Get commit configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit configuration.</returns>
        [HttpGet("package/{id}/configuration/{sha}")]
        public async Task<IActionResult> GetCommitConfiguration(string id, string sha)
        {
            return Ok(await GithubService.GetCommitConfiguration(id, sha));
        }
    }
}