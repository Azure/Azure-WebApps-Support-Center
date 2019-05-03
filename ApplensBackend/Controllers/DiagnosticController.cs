// <copyright file="DiagnosticController.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SendGrid.Helpers.Mail;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// Diagnostic controller.
    /// </summary>
    [Route("api")]
    [Authorize]
    public class DiagnosticController : Controller
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="DiagnosticController"/> class.
        /// </summary>
        /// <param name="env">The environment.</param>
        /// <param name="diagnosticClient">Diagnostic client.</param>
        /// <param name="emailNotificationService">Email notification service.</param>
        public DiagnosticController(IHostingEnvironment env, IDiagnosticClientService diagnosticClient, IEmailNotificationService emailNotificationService)
        {
            Env = env;
            DiagnosticClient = diagnosticClient;
            EmailNotificationService = emailNotificationService;
        }

        private IDiagnosticClientService DiagnosticClient { get; }

        private IEmailNotificationService EmailNotificationService { get; }

        private IHostingEnvironment Env { get; }

        /// <summary>
        /// Action for invoke request.
        /// </summary>
        /// <param name="body">Request body.</param>
        /// <returns>Task for invoking request.</returns>
        [HttpPost("invoke")]
        [HttpOptions("invoke")]
        public async Task<IActionResult> Invoke([FromBody]JToken body)
        {
            if (!Request.Headers.ContainsKey("x-ms-path-query"))
            {
                return BadRequest("Missing x-ms-path-query header");
            }

            string path = Request.Headers["x-ms-path-query"];

            string method = HttpMethod.Get.Method;
            if (Request.Headers.ContainsKey("x-ms-method"))
            {
                method = Request.Headers["x-ms-method"];
            }

            bool internalClient = true;
            if (Request.Headers.ContainsKey("x-ms-internal-client"))
            {
                bool.TryParse(Request.Headers["x-ms-internal-client"], out internalClient);
            }

            bool internalView = true;
            if (Request.Headers.ContainsKey("x-ms-internal-view"))
            {
                bool.TryParse(Request.Headers["x-ms-internal-view"], out internalView);
            }

            string alias = string.Empty;
            string detectorId = string.Empty;
            string detectorAuthor = string.Empty;

            List<EmailAddress> tos = new List<EmailAddress>();
            List<string> distinctEmailRecipientsList = new List<string>();

            if (body != null && body["id"] != null)
            {
                detectorId = body["id"].ToString();
            }

            string applensLink = "https://applens.azurewebsites.net/" + path.Replace("resourcegroup", "resourceGroup").Replace("diagnostics/publish", "") + "detectors/" + detectorId;

            if (!string.IsNullOrWhiteSpace(Request.Headers["x-ms-emailRecipients"]))
            {
                detectorAuthor = Request.Headers["x-ms-emailRecipients"];
                char[] separators = { ' ', ',', ';', ':' };

                // Currently there's a bug in sendgrid v3, email will not be sent if there are duplicates in the recipient list
                // Remove duplicates before adding to the recipient list
                string[] authors = detectorAuthor.Split(separators, StringSplitOptions.RemoveEmptyEntries).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
                foreach (var author in authors)
                {
                    if (string.IsNullOrWhiteSpace(alias))
                    {
                        alias = author;
                    }

                    string baseEmailAddressString = author.EndsWith("@microsoft.com", StringComparison.OrdinalIgnoreCase) ? author : author + "@microsoft.com" ;

                    if (!distinctEmailRecipientsList.Contains(baseEmailAddressString))
                    {
                        EmailAddress emailAddress = new EmailAddress(baseEmailAddressString);
                        tos.Add(emailAddress);
                        distinctEmailRecipientsList.Add(baseEmailAddressString);
                    }
                }
            }

            var scriptETag = string.Empty;

            if (Request.Headers.ContainsKey("diag-script-etag"))
            {
                scriptETag = Request.Headers["diag-script-etag"];
            }

            var assemblyName = string.Empty;

            if (Request.Headers.ContainsKey("diag-assembly-name"))
            {
                assemblyName = Request.Headers["diag-assembly-name"];
            }

            HttpRequestHeaders headers = new HttpRequestMessage().Headers;
            if (!string.IsNullOrWhiteSpace(scriptETag))
            {
                headers.Add("diag-script-etag", scriptETag);
            }

            if (!string.IsNullOrWhiteSpace(assemblyName))
            {
                headers.Add("diag-assembly-name", assemblyName);
            }

            var response = await DiagnosticClient.Execute(method, path, body?.ToString(), internalClient, internalView, headers);

            if (response != null)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                if (response.IsSuccessStatusCode)
                {
                    var responseObject = JsonConvert.DeserializeObject(responseString);
                    if (response.Headers.Contains("diag-script-etag"))
                    {
                        Request.HttpContext.Response.Headers.Add("diag-script-etag", response.Headers.GetValues("diag-script-etag").First());
                    }

                    if (path.EndsWith("/diagnostics/publish", StringComparison.OrdinalIgnoreCase) && tos.Count > 0 && Env.IsProduction())
                    {
                        EmailNotificationService.SendPublishingAlert(alias, detectorId, applensLink, tos);
                    }

                    return Ok(responseObject);
                }
                else if (response.StatusCode == HttpStatusCode.BadRequest)
                {
                    return BadRequest(responseString);
                }
            }

            return StatusCode((int)response.StatusCode);
        }
    }
}
