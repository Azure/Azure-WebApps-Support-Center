using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Authorization;
using AppLensV3.Services.EmailNotificationService;
using SendGrid.Helpers.Mail;
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Hosting;

namespace AppLensV3.Controllers
{
    [Route("api")]
    [Authorize]
    public class DiagnosticController : Controller
    {
        IDiagnosticClientService _diagnosticClient;
        IEmailNotificationService _emailNotificationService;
        IHostingEnvironment _env;


        public DiagnosticController(IHostingEnvironment env, IDiagnosticClientService diagnosticClient, IEmailNotificationService emailNotificationService)
        {
            this._env = env;
            this._diagnosticClient = diagnosticClient;
            this._emailNotificationService = emailNotificationService;
        }

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

            bool internalView = true;
            if (Request.Headers.ContainsKey("x-ms-internal-view"))
            {
                bool.TryParse(Request.Headers["x-ms-internal-view"], out internalView);
            }

            string alias = "";
            string detectorId = "";
            string detectorAuthor = "";

            List<EmailAddress> tos = new List<EmailAddress>();
            List<String> distinctEmailRecipientsList = new List<string>();

            if (body != null && body["id"] != null)
            {
                detectorId = body["id"].ToString();
            }

            string applensLink = "https://applens.azurewebsites.net/" + path.Replace("resourcegroup", "resourceGroup").Replace("diagnostics/publish", "") + "detectors/" + detectorId;

            if (!String.IsNullOrWhiteSpace(Request.Headers["x-ms-emailRecipients"]))
            {
                detectorAuthor = Request.Headers["x-ms-emailRecipients"];
                char[] separators = { ' ', ',', ';', ':' };

                // Currently there's a bug in sendgrid v3, email will not be sent if there are duplicates in the recipient list
                // Remove duplicates before adding to the recipient list
                string[] authors = detectorAuthor.Split(separators, StringSplitOptions.RemoveEmptyEntries).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
                foreach (var author in authors)
                {
                    if (String.IsNullOrWhiteSpace(alias))
                    {
                        alias = author;
                    }

                    string baseEmailAddressString = author.ToLower().EndsWith("@microsoft.com") ? author : author + "@microsoft.com" ;

                    if (!distinctEmailRecipientsList.Contains(baseEmailAddressString))
                    {
                        EmailAddress emailAddress = new EmailAddress(baseEmailAddressString);
                        tos.Add(emailAddress);
                        distinctEmailRecipientsList.Add(baseEmailAddressString);
                    }
                }
            }

            var response = await this._diagnosticClient.Execute(method, path, body?.ToString(), internalView);

            if (response != null)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                if (response.IsSuccessStatusCode)
                {
                    var responseObject = JsonConvert.DeserializeObject(responseString);
                    if (path.ToLower().EndsWith("/diagnostics/publish") && tos.Count > 0 && _env.IsProduction())
                    {
                        await this._emailNotificationService.SendPublishingAlert(alias, detectorId, applensLink, tos);
                    }

                    return Ok(responseObject);
                }
                else if(response.StatusCode == HttpStatusCode.BadRequest)
                {
                    return BadRequest(responseString);
                }
            }

            return StatusCode((int)response.StatusCode);
        }
    }
}
