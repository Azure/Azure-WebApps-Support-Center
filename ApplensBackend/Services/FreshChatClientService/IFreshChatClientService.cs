using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface IFreshChatClientService
    {
        /// <summary>
        /// Get the API Key and validate is the call is genuine or should be rejected.
        /// </summary>
        /// <param name="apiKey">Api Key as sent by FreshChat webhook.</param>
        /// <returns>True if success. False to reject.</returns>
        bool VerifyCall(string apiKey);


        /// <summary>
        /// Looks up agent details in the internal cache. If not present, makes a call to FreshChat API to retrieve agent details, updates it in the cache and then returns the details to caller.
        /// </summary>
        /// <param name="agentId">Identifier for the agent whose details is required.</param>
        /// <returns>Details of the agent. <see cref="AgentDetails" />.</returns>
        Task<AgentDetails> GetAgentDetails(string agentId);

        /// <summary>
        /// Looks up user details in the internal cache. If not present, makes a call to FreshChat API to retrieve user details, updates it in the cache and then returns the details to caller.
        /// </summary>
        /// <param name="userId">Identifier for the user whose details is required.</param>
        /// <param name="conversationId">If present, the ResourceUri cahe is updated. This can be used to associate a conversation with a resource URI.</param>
        /// <returns>Details of the agent. <see cref="UserDetails" />.</returns>
        Task<UserDetails> GetUserDetails(string userId, string conversationId = null);

        /// <summary>
        /// Gets the ARM resource uri to which the current conversation is linked to.
        /// </summary>
        /// <param name="conversationId">Conversation ID uniquely identifying a conversation.</param>
        /// <returns>ARM resource URI.</returns>
        string GetResourceUri(string conversationId);

        /// <summary>
        /// Takes a text and anonymizes PII information.
        /// </summary>
        /// <param name="content">String content that may contain PII information.</param>
        /// <returns>Anonymized string content.</returns>
        string RemovePII(string content);

        /// <summary>
        /// Logs a message to the Diagnostics kusto table.
        /// </summary>
        /// <param name="logMessage">Message to log to Kusto</param>
        /// <returns>True if success, False otherwise.</returns>
        Task<bool> LogToKusto(InternalEventBody logMessage);

    }
}
