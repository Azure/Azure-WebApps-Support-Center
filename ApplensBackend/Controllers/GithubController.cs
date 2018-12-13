using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace AppLensV3.Controllers
{
    [Produces("application/json")]
    [Route("api/github")]
    [Authorize]
    public class GithubController : Controller
    {
        private IGithubClientService _githubService;

        public GithubController(IGithubClientService githubService)
        {
            _githubService = githubService;
        }

        [HttpGet("detectortemplate/{name}")]
        public async Task<IActionResult> GetTemplate(string name)
        {
            string content = await _githubService.GetRawFile(GithubConstants.DetectorTemplatePath.Replace("{filename}", name));
            return Ok(content);
        }

        [HttpGet("detectors/{id}")]
        public async Task<IActionResult> GetDetectorFile(string id)
        {
            string content = await _githubService.GetDetectorFile(id);
            return Ok(content);
        }

        [HttpPost("publishdetector")]
        public async Task<IActionResult> PublishPackage([FromBody]Package pkg)
        {
            if (pkg == null || string.IsNullOrWhiteSpace(pkg.Id) || string.IsNullOrWhiteSpace(pkg.DllBytes))
            {
                return BadRequest();
            }

            await _githubService.Publish(pkg);
            return Accepted();
        }

        [HttpGet("detectors/{id}/changelist")]
        public async Task<IActionResult> GetDetectorChangelist(string id)
        {

            var changelist = await _githubService.GetAllCommits(id);
            return Ok(changelist);
        }

        [HttpGet("detectors/{id}/commit/{sha}")]
        public async Task<IActionResult> GetDetectorChangelist(string id, string sha)
        {
            var changelist = await _githubService.GetCommitContent(id, sha);
            return Ok(changelist);
        }
    }
}