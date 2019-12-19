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
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SendGrid.Helpers.Mail;
using static AppLensV3.Helpers.HeaderConstants;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// Diagnostic controller.
    /// </summary>
    [Route("api")]
    [Authorize(Policy = "ApplensAccess")]
    public class DiagnosticController : Controller
    {
        private readonly string[] blackListedAscRegions;
        private readonly string diagAscHeaderValue;

        private class InvokeHeaders
        {
            public string Path { get; set; }
            public string Method { get; set; }
            public IEnumerable<string> DetectorAuthors { get; set; }
            public bool InternalClient { get; set; }
            public bool InternalView { get; set; }
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="DiagnosticController"/> class.
        /// </summary>
        /// <param name="env">The environment.</param>
        /// <param name="diagnosticClient">Diagnostic client.</param>
        /// <param name="emailNotificationService">Email notification service.</param>
        public DiagnosticController(IHostingEnvironment env, IDiagnosticClientService diagnosticClient, IEmailNotificationService emailNotificationService, IConfiguration configuration)
        {
            Env = env;
            DiagnosticClient = diagnosticClient;
            EmailNotificationService = emailNotificationService;
            blackListedAscRegions = configuration.GetValue<string>("BlackListedAscRegions", string.Empty).Replace(" ", string.Empty).Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            diagAscHeaderValue = configuration.GetValue<string>("DiagAscHeaderValue");
        }

        private IDiagnosticClientService DiagnosticClient { get; }

        private IEmailNotificationService EmailNotificationService { get; }

        private IHostingEnvironment Env { get; }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return new OkResult();
        }

        private static string TryGetHeader(HttpRequest request, string headerName, string defaultValue = "") =>
            request.Headers.ContainsKey(headerName) ? (string)request.Headers[headerName] : defaultValue;

        /// <summary>
        /// Action for invoke request.
        /// </summary>
        /// <param name="body">Request body.</param>
        /// <returns>Task for invoking request.</returns>
        [HttpPost("invoke")]
        [HttpOptions("invoke")]
        public async Task<IActionResult> Invoke([FromBody]JToken body)
        {
            var invokeHeaders = ProcessInvokeHeaders();

            if (string.IsNullOrWhiteSpace(invokeHeaders.Path))
            {
                return BadRequest($"Missing {PathQueryHeader} header");
            }

            var detectorId = body?["id"] != null ? body["id"].ToString() : string.Empty;

            string applensLink = "https://applens.azurewebsites.net/" + invokeHeaders.Path.Replace("resourcegroup", "resourceGroup").Replace("diagnostics/publish", string.Empty) + "detectors/" + detectorId;

            var detectorAuthorEmails = new List<EmailAddress>();
            if (invokeHeaders.DetectorAuthors.Any())
            {
                detectorAuthorEmails = invokeHeaders.DetectorAuthors
                    .Select(x => x.EndsWith("@microsoft.com") ? x : $"{x}@microsoft.com")
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Select(x => new EmailAddress(x)).ToList();
            }

            HttpRequestHeaders headers = new HttpRequestMessage().Headers;
            foreach (var header in Request.Headers)
            {
                if (header.Key.Equals("diag-georegion", StringComparison.CurrentCultureIgnoreCase) && blackListedAscRegions.Any(region => header.Value.FirstOrDefault()?.Contains(region) == true))
                {
                    headers.Add("x-ms-subscription-location-placementid", diagAscHeaderValue);
                }
                else if ((header.Key.StartsWith("x-ms-") || header.Key.StartsWith("diag-")) && !headers.Contains(header.Key))
                {
                    headers.Add(header.Key, header.Value.ToString());
                }
            }

            var response = await DiagnosticClient.Execute(invokeHeaders.Method, invokeHeaders.Path, body?.ToString(), invokeHeaders.InternalClient, invokeHeaders.InternalView, headers);
            if (response == null)
            {
                return StatusCode(500, "Null response from DiagnosticClient");
            }

            var responseTask = response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, await responseTask);
            }

            if (response.Headers.Contains(ScriptEtagHeader))
            {
                Request.HttpContext.Response.Headers.Add(ScriptEtagHeader, response.Headers.GetValues(ScriptEtagHeader).First());
            }

            if (invokeHeaders.Path.EndsWith("/diagnostics/publish", StringComparison.OrdinalIgnoreCase) && detectorAuthorEmails.Count > 0 && Env.IsProduction())
            {
                EmailNotificationService.SendPublishingAlert(invokeHeaders.DetectorAuthors.Last(), detectorId, applensLink, detectorAuthorEmails);
            }

            return Ok(JsonConvert.DeserializeObject(await responseTask));
        }

        private static string GetHeaderOrDefault(IHeaderDictionary headers, string headerName, string defaultValue = "")
        {
            if (headers == null || headerName == null)
            {
                return defaultValue;
            }

            if (headers.TryGetValue(headerName, out var outValue))
            {
                return outValue;
            }

            return defaultValue;
        }

        private InvokeHeaders ProcessInvokeHeaders()
        {
            var path = GetHeaderOrDefault(Request.Headers, PathQueryHeader);
            var method = GetHeaderOrDefault(Request.Headers, MethodHeader, HttpMethod.Get.Method);
            var rawDetectorAuthors = GetHeaderOrDefault(Request.Headers, EmailRecipientsHeader);
            var detectorAuthors = rawDetectorAuthors.Split(new char[] { ' ', ',', ';', ':' }, StringSplitOptions.RemoveEmptyEntries);

            bool.TryParse(GetHeaderOrDefault(Request.Headers, InternalClientHeader, true.ToString()), out var internalClient);
            bool.TryParse(GetHeaderOrDefault(Request.Headers, InternalViewHeader, true.ToString()), out var internalView);

            return new InvokeHeaders()
            {
                Path = path,
                Method = method,
                DetectorAuthors = detectorAuthors,
                InternalClient = internalClient,
                InternalView = internalView
            };
        }
    }
}
