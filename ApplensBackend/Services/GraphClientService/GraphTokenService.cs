using System;
using System.IO;
using System.Globalization;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using AppLensV3.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace AppLensV3.Services
{
    public interface IGraphTokenService
    {
        Task<string> GetAuthorizationTokenAsync();
    }

    public class GraphTokenService : IGraphTokenService
    {
        private AuthenticationContext _authContext;
        private ClientCredential _clientCredential;
        private string _authorizationToken;
        private bool _tokenAcquiredAtleastOnce;
        private Task<AuthenticationResult> _acquireTokenTask;
        private string _graphAppId;
        private string _graphAppKey;

        public GraphTokenService(IConfiguration configuration)
        {
            _graphAppId = configuration["Graph:ClientId"];
            _graphAppKey = configuration["Graph:AppKey"];
            _authContext = new AuthenticationContext(GraphConstants.MicrosoftTenantAuthorityUrl);
            _clientCredential = new ClientCredential(_graphAppId, _graphAppKey);
            _tokenAcquiredAtleastOnce = false;

            StartTokenRefresh();
        }

        private async Task StartTokenRefresh()
        {
            while (true)
            {
                DateTime invocationStartTime = DateTime.UtcNow;
                string exceptionType = string.Empty;
                string exceptionDetails = string.Empty;
                string message = string.Empty;

                try
                {
                    _acquireTokenTask = _authContext.AcquireTokenAsync(GraphConstants.DefaultGraphEndpoint, _clientCredential);
                    AuthenticationResult authResult = await _acquireTokenTask;
                    _authorizationToken = GetAuthTokenFromAuthenticationResult(authResult);
                    _tokenAcquiredAtleastOnce = true;
                    message = "Token Acquisition Status : Success";
                }
                catch (Exception ex)
                {
                    exceptionType = ex.GetType().ToString();
                    exceptionDetails = ex.ToString();
                    message = "Token Acquisition Status : Failed";
                }
                finally
                {
                    DateTime invocationEndTime = DateTime.UtcNow;
                    long latencyInMs = Convert.ToInt64((invocationEndTime - invocationStartTime).TotalMilliseconds);

                    // TODO : Log an Event
                }

                await Task.Delay(GraphConstants.TokenRefreshIntervalInMs);
            }
        }

        private string GetAuthTokenFromAuthenticationResult(AuthenticationResult authenticationResult)
        {
            return $"{authenticationResult.AccessTokenType} {authenticationResult.AccessToken}";
        }

        public async Task<string> GetAuthorizationTokenAsync()
        {
            if (!_tokenAcquiredAtleastOnce)
            {
                var authResult = await _acquireTokenTask;
                return GetAuthTokenFromAuthenticationResult(authResult);
            }

            return _authorizationToken;
        }
    }
}
