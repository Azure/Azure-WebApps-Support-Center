// <copyright file="DiagnosticController.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Net.Http.Headers;
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
        IConfiguration config;
        private readonly string[] blackListedAscRegions;
        private readonly string diagAscHeaderValue;

        private class InvokeHeaders
        {
            public string Path { get; set; }
            public string Method { get; set; }
            public IEnumerable<string> DetectorAuthors { get; set; }
            public string ModifiedBy { get; set; }
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
            this.config = configuration;
        }

        private IDiagnosticClientService DiagnosticClient { get; }

        private IEmailNotificationService EmailNotificationService { get; }

        private IHostingEnvironment Env { get; }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return new OkResult();
        }

        [HttpGet("appsettings/{name}")]
        public IActionResult GetAppSettingValue(string name){
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest("App setting name is empty");
            }
            return Ok(config[name]);
        }

        private static string TryGetHeader(HttpRequest request, string headerName, string defaultValue = "") =>
            request.Headers.ContainsKey(headerName) ? (string)request.Headers[headerName] : defaultValue;

        [HttpGet("invoke")]
        public async Task<IActionResult> InvokeUsingGet(string path, string method = "POST")
        {
            IActionResult response;
            string reason;

            if (string.IsNullOrWhiteSpace(path))
            {
                reason = @"Expecting a URL encoded path as a query string parameter eg., https:\\applens.azurewebsites.net?path=%2Fsubscriptions%2F0000-0000-000000-00000000-0000000%2FresourceGroups%2Fexample-rg%2Fproviders%2FMicrosoft.Web%2Fsites%2Fexample_sites%2Fdetectors";
                return BadRequest(reason);
            }

            this.HttpContext.Request.Headers.Add(PathQueryHeader, path);
            this.HttpContext.Request.Headers.Add(MethodHeader, method);
            this.HttpContext.Request.Headers.Add(HeaderNames.ContentType, "application/json");

            try
            {
                response = await Invoke(null);
            }
            catch (Exception ex)
            {
                string errorResponse = $"Error encountered during API call\n{ex.ToString()}";
                response = StatusCode(500, errorResponse);
            }

            return response;
        }

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

            string detectorId = null;
            if (body?.GetType() != typeof(JArray))
            {
                detectorId = body?["id"] != null ? body["id"].ToString() : string.Empty;
            }

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
                if (header.Key.Equals("x-ms-location", StringComparison.CurrentCultureIgnoreCase) && blackListedAscRegions.Any(region => header.Value.FirstOrDefault()?.Contains(region) == true))
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
                EmailNotificationService.SendPublishingAlert(invokeHeaders.ModifiedBy, detectorId, applensLink, detectorAuthorEmails);
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
            var authorization = Request.Headers["Authorization"].ToString();
            string userId = string.Empty;

            if (!string.IsNullOrWhiteSpace(authorization))
            {
                string accessToken = authorization.Split(" ")[1];
                var token = new JwtSecurityToken(accessToken);
                object upn;
                if (token.Payload.TryGetValue("upn", out upn))
                {
                    userId = upn.ToString().Replace("@microsoft.com", string.Empty);
                }
            }

            var path = GetHeaderOrDefault(Request.Headers, PathQueryHeader);
            var method = GetHeaderOrDefault(Request.Headers, MethodHeader, HttpMethod.Get.Method);
            var rawDetectorAuthors = GetHeaderOrDefault(Request.Headers, EmailRecipientsHeader);
            var detectorAuthors = rawDetectorAuthors.Split(new char[] { ' ', ',', ';', ':' }, StringSplitOptions.RemoveEmptyEntries);
            var modifiedBy = GetHeaderOrDefault(Request.Headers, ModifiedByHeader, userId);
            bool.TryParse(GetHeaderOrDefault(Request.Headers, InternalClientHeader, true.ToString()), out var internalClient);
            bool.TryParse(GetHeaderOrDefault(Request.Headers, InternalViewHeader, true.ToString()), out var internalView);

            return new InvokeHeaders()
            {
                Path = path,
                Method = method,
                DetectorAuthors = detectorAuthors,
                InternalClient = internalClient,
                InternalView = internalView,
                ModifiedBy = modifiedBy
            };
        }
    }
}
