using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace AppLensV3.Attributes
{
    /// <summary>
    /// Attribute to enforce Fresh Chat type Authorization.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true, Inherited = true)]
    public class FreshChatAuth : Attribute, IAuthorizationFilter
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="FreshChatAuth"/> class.
        /// </summary>
        public FreshChatAuth()
        {
        }

        /// <summary>
        /// Checks for the presence of API Key that is configured in Freshchat webhook.
        /// </summary>
        /// <param name="context"></param>
        void IAuthorizationFilter.OnAuthorization(AuthorizationFilterContext context)
        {
            var freshChatHeaderPresent = context.HttpContext.Request.Headers.Keys.Where(k => string.Compare(k, "X-Freshchat-Signature", true) == 0);
            if (!freshChatHeaderPresent.Any())
            {
                context.Result = new BadRequestObjectResult("Missing X-Freshchat-Signature header.");
            }
            else
            {
                Microsoft.Extensions.Primitives.StringValues apiKeyValues = default(Microsoft.Extensions.Primitives.StringValues);
                if (context.HttpContext.Request.Query.TryGetValue("freshchatAPIKey", out apiKeyValues))
                {
                    if (apiKeyValues.Count > 0)
                    {
                        string apiKey = apiKeyValues[0];
                        IFreshChatClientService freshChatClient = (IFreshChatClientService)context.HttpContext.RequestServices.GetService(typeof(IFreshChatClientService));
                        if (!freshChatClient.VerifyCall(apiKey))
                        {
                            context.Result = new UnauthorizedResult();
                        }
                    }
                    else
                    {
                        context.Result = new BadRequestObjectResult("Missing freshchatAPIKey.");
                    }
                }
                else
                {
                    context.Result = new BadRequestObjectResult("Missing freshchatAPIKey.");
                }
            }
        }
    }
}
