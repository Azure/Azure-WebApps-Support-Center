using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Security.Principal;
using System.Web;

namespace AscInsightsGeo.Security
{
    public class AuthenticationModule : IHttpModule
    {
        private List<string> allowedCertThumbprints = null;
        private List<string> allowedCertSubjects = null;

        public AuthenticationModule()
        {
            // read allowed certificates
            allowedCertThumbprints = Constants.AllowedCertThumbprints?.Split(',').ToList();
            allowedCertSubjects = Constants.AllowedCertSubjects?.Split(';').Select(s => s.Replace(" ", string.Empty)).ToList();
        }

        private void OnAuthenticateRequest(object sender, EventArgs e)
        {
            HttpContext context = HttpContext.Current;
            bool isValid = false;

            if (context.Request.ClientCertificate != null && context.Request.ClientCertificate.IsPresent)
            {
                X509Certificate2 cert = new X509Certificate2(context.Request.ClientCertificate.Certificate);
                isValid = allowedCertThumbprints.Any(s => s.Equals(cert.Thumbprint, StringComparison.OrdinalIgnoreCase)) || allowedCertSubjects.Any(s => s.Equals(cert.Subject.Replace(" ", string.Empty), StringComparison.OrdinalIgnoreCase));
                Trace.WriteLineIf(!isValid, $"Authorization failed for client certificate {cert.Subject}");
            }else
            {
                Trace.WriteLine("Authorization failed because of empty client certiicate.");
            }

            if (!isValid)
            {
                DenyAccess();
            }
        }

        public void Init(HttpApplication context)
        {
            // event registration
            context.AuthenticateRequest += OnAuthenticateRequest;
        }

        public void Dispose()
        {

        }

        internal static void DenyAccess()
        {
            HttpContext context = HttpContext.Current;
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            context.Response.SubStatusCode = 444;
            context.Response.End();
        }
    }
}