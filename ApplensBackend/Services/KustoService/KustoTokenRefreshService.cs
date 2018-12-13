using AppLensV3.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface IKustoTokenRefreshService
    {
        Task<string> GetAuthorizationTokenAsync();
    }

    public class KustoTokenRefreshService : IKustoTokenRefreshService
    {
        private AuthenticationContext _authContext;
        private ClientCredential _clientCredential;
        private string _authorizationToken;
        private bool _tokenAcquiredAtleastOnce;
        private Task<AuthenticationResult> _acquireTokenTask;
        private string _kustoAppId;
        private string _kustoAppKey;

        public KustoTokenRefreshService(IConfiguration configuration)
        {
            _kustoAppId = configuration["Kusto:ClientId"];
            _kustoAppKey = configuration["Kusto:AppKey"];
            _authContext = new AuthenticationContext(KustoConstants.MicrosoftTenantAuthorityUrl);
            _clientCredential = new ClientCredential(_kustoAppId, _kustoAppKey);
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
                    _acquireTokenTask = _authContext.AcquireTokenAsync(KustoConstants.DefaultKustoEndpoint, _clientCredential);
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

                await Task.Delay(KustoConstants.TokenRefreshIntervalInMs);
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
