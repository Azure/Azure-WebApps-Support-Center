using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Authorization;
using System.Reflection;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Web;

namespace AppLensV3.Controllers
{
    [Route("api")]
    [Authorize]
    public class LocalDevelopmentController : Controller
    {
        ILocalDevelopmentClientService _localDevelopmentClient;

        public LocalDevelopmentController(ILocalDevelopmentClientService localDevelopmentClient)
        {
            this._localDevelopmentClient = localDevelopmentClient;
        }

        [HttpPost("localdev")]
        public async Task<IActionResult> PrepareLocalDevEnvironementstring (string detectorId, [FromBody]JToken body)
        {
            string scriptBody = "";
            string resourceId = "";

            if (Request.Headers.ContainsKey("x-ms-path-query"))
            {
                resourceId = Request.Headers["x-ms-path-query"];
            }

            if (body == null)
            {
                return BadRequest();
            }

            if (body["script"] != null)
            {
                scriptBody = body["script"].ToString();
            }

            string zipBlobUri = await this._localDevelopmentClient.PrepareLocalDevelopment(detectorId, scriptBody?.ToString(), resourceId);
            return Ok(zipBlobUri);
        }
    }
}
