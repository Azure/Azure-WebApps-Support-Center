using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    /// <summary>
    /// Helper class to process and log freshchat messages.
    /// </summary>
    public class FreshChatClientService : IFreshChatClientService
    {
        private readonly IDiagnosticClientService _diagnosticClient;
        private IConfiguration _configuration;

        // Using the same limit for all caches. The number of agents and caht volume is low and the same limit will work for all caches
        private int maxCacheEntries = 400;
        private ConcurrentDictionary<string, AgentCacheEntry> _agentCache;
        private ConcurrentDictionary<string, UserCacheEntry> _userCache;
        private ConcurrentDictionary<string, ResourceCacheEntry> _resourceConversationCache;

        private HttpClient HttpClient { get; set; }

        private string ApplensApiKey { get; set; }
        private string FreshChatAuthHeader { get; set; }
        private string FreshChatBaseUri { get; set; }
        private string UserAgentToFreshChat { get; set; }

        /// <summary>
        /// Set locals based on configuation.
        /// </summary>
        /// <param name="configuration"></param>
        public void LoadConfigurations(IConfiguration configuration)
        {
            _configuration = configuration;
            ApplensApiKey = _configuration["FreshChat:ApplensApiKey"];
            FreshChatAuthHeader = _configuration["FreshChat:FreshChatAuthHeader"];
            FreshChatBaseUri = _configuration["FreshChat:FreshChatBaseUri"];
            UserAgentToFreshChat = _configuration["FreshChat:UserAgentToFreshChat"];

            _agentCache = new ConcurrentDictionary<string, AgentCacheEntry>();
            _userCache = new ConcurrentDictionary<string, UserCacheEntry>();
            _resourceConversationCache =  new ConcurrentDictionary<string, ResourceCacheEntry>();
    }

        /// <summary>
        /// Add or update agent information in agent cache.
        /// </summary>
        /// <param name="agentId">Identifier for the agent.</param>
        /// <param name="value">Details of the Agent. See <see cref="AgentDetails"/>.</param>
        private void AddOrUpdateAgent(string agentId, AgentDetails value)
        {
            if (!string.IsNullOrWhiteSpace(agentId))
            {
                AgentCacheEntry newEntry = new AgentCacheEntry();
                newEntry.agent = value;
                newEntry.timeStamp = DateTime.Now;
                _agentCache.AddOrUpdate(agentId.ToLower(), newEntry, (existingKey, oldValue) => newEntry);

                if (_agentCache.Count > maxCacheEntries)
                {
                    TryRemoveAgent(_agentCache.OrderBy(o => o.Value.timeStamp).FirstOrDefault().Key);
                }
            }
        }

        private bool TryRemoveAgent(string agentId)
        {
            AgentCacheEntry ignored;
            return _agentCache.TryRemove(agentId.ToLower(), out ignored);
        }

        /// <inheritdoc/>
        public async Task<AgentDetails> GetAgentDetails(string agentId)
        {
            AgentCacheEntry cacheEntry;
            bool result = _agentCache.TryGetValue(agentId.ToLower(), out cacheEntry);
            if (result)
            {
                return cacheEntry.agent;
            }
            else
            {
                AgentDetails currAgent = new AgentDetails();
                string uri = $"/agents/{agentId}";
                try
                {
                    HttpResponseMessage response = await MakeGetCallToFreshChat(uri);
                    string responseContent = await response.Content.ReadAsStringAsync();
                    var jsonResponse = JToken.Parse(responseContent);

                    currAgent.Id = agentId;
                    currAgent.FirstName = (string)jsonResponse["first_name"];
                    currAgent.LastName = (string)jsonResponse["last_name"];
                    currAgent.Email = (string)jsonResponse["email"];
                    currAgent.Avatar = new Avatar() { Url = (string)jsonResponse["avatar"].Value<JToken>("url") };

                    // Add to cache for future lookups
                    AddOrUpdateAgent(currAgent.Id, currAgent);
                    return currAgent;
                }
                catch (Exception ex)
                {
                    InternalEventBody kustoLog = new InternalEventBody();
                    kustoLog.EventType = "FreshChatLoggingUnhandledException";
                    kustoLog.EventContent = $"FreshChatException. Unhandled {ex.GetType().ToString()} exception while calling FreshChat server to fetch sender details. URI: {uri}";
                    await LogToKusto(kustoLog);
                    throw ex;
                }
            }
        }

        private void AddOrUpdateUser(string userId, UserDetails value)
        {
            if (!string.IsNullOrWhiteSpace(userId))
            {
                UserCacheEntry newEntry = new UserCacheEntry();
                newEntry.user = value;
                newEntry.timeStamp = DateTime.Now;
                _userCache.AddOrUpdate(userId.ToLower(), newEntry, (existingKey, oldValue) => newEntry);

                if (_userCache.Count > maxCacheEntries)
                {
                    TryRemoveUser(_userCache.OrderBy(o => o.Value.timeStamp).FirstOrDefault().Key);
                }
            }
        }

        private bool TryRemoveUser(string userId)
        {
            UserCacheEntry ignored;
            return _userCache.TryRemove(userId.ToLower(), out ignored);
        }

        /// <inheritdoc/>
        public async Task<UserDetails> GetUserDetails(string userId, string conversationId = null)
        {
            UserCacheEntry cacheEntry;
            bool result = _userCache.TryGetValue(userId.ToLower(), out cacheEntry);
            if (result)
            {
                return cacheEntry.user;
            }
            else
            {
                UserDetails currUser = new UserDetails();
                string uri = $"/users/{userId}";
                try
                {
                    HttpResponseMessage response = await MakeGetCallToFreshChat(uri);
                    string responseContent = await response.Content.ReadAsStringAsync();
                    var jsonResponse = JToken.Parse(responseContent);

                    currUser.Id = userId;
                    currUser.ReferenceId = (string)jsonResponse["reference_id"];
                    currUser.FirstName = !string.IsNullOrWhiteSpace(currUser.ReferenceId) && currUser.ReferenceId.Split("sites/").Length > 1 ? currUser.ReferenceId.Split("sites/")[1] : (string)jsonResponse["first_name"];
                    currUser.LastName = string.Empty;
                    currUser.Email = string.Empty;
                    currUser.Avatar = new Avatar() { Url = (string)jsonResponse["avatar"].Value<JToken>("url") };

                    // Add to cache for future lookups
                    AddOrUpdateUser(currUser.Id, currUser);

                    // Update the _resourceConversationCache
                    if (!string.IsNullOrWhiteSpace(conversationId))
                    {
                        AddOrUpdateResourceUri(conversationId, currUser.ReferenceId);
                    }

                    return currUser;
                }
                catch (Exception ex)
                {
                    InternalEventBody kustoLog = new InternalEventBody();
                    kustoLog.EventType = "FreshChatLoggingUnhandledException";
                    kustoLog.EventContent = $"FreshChatException. Unhandled {ex.GetType().ToString()} exception while calling FreshChat server to fetch sender details. URI: {uri}";
                    await LogToKusto(kustoLog);
                    throw ex;
                }
            }
        }

        private void AddOrUpdateResourceUri(string conversationId, string resourceUri)
        {
            ResourceCacheEntry newEntry = new ResourceCacheEntry();
            newEntry.resourceUri = resourceUri;
            newEntry.timeStamp = DateTime.Now;
            _resourceConversationCache.AddOrUpdate(conversationId.ToLower(), newEntry, (existingKey, oldValue) => newEntry);

            if (_resourceConversationCache.Count > maxCacheEntries)
            {
                TryRemoveResourceUri(_resourceConversationCache.OrderBy(o => o.Value.timeStamp).FirstOrDefault().Key);
            }
        }

        /// <inheritdoc/>
        public string GetResourceUri(string conversationId)
        {
            ResourceCacheEntry cacheEntry;
            string resourceUri = string.Empty;

            if (_resourceConversationCache.TryGetValue(conversationId, out cacheEntry))
            {
                resourceUri = cacheEntry.resourceUri;
            }

            return resourceUri;
        }

        private bool TryRemoveResourceUri(string conversationId)
        {
            ResourceCacheEntry ignored;
            return _resourceConversationCache.TryRemove(conversationId.ToLower(), out ignored);
        }

        private void InitializeHttpClient()
        {
            HttpClient = new HttpClient
            {
                MaxResponseContentBufferSize = int.MaxValue,
                Timeout = TimeSpan.FromSeconds(30)
            };
            HttpClient.BaseAddress = new Uri(FreshChatBaseUri);
            HttpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            HttpClient.DefaultRequestHeaders.Add("User-Agent", this.UserAgentToFreshChat);
            HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", FreshChatAuthHeader);
        }

        private string MaskPhone(string content)
        {
            // (\+?\d ?\d ?\d ?) Matches an optional + sign and optional up to 3 digits
            // ([\d\-)\(\s]{10}) Matches 10 occurrences of either a digit, - ) ( or a white space

            /*Matches
             * Phone:0914252358741 saasd
             * Phone = +0914252358741 saasd
             * Phone + 914252358741 saasd
             * Phone + 14252358741 saasd
             * Phone 4252358741 s sd ad asd
             * saasd(425)222 - 7777 saasd
             * saasd 425 - 222 - 7777saasd
             * saasd + 1425 - 222 - 7777 saasd
             * saasd 425 222 7777 dfas
             */
            // Does not match : I have 200 websites
            string pattern = @"(\+?\d?\d?\d?)([\d\-)\(\s]{10})";
            return Regex.Replace(content, pattern, m => " ********** ");
        }

        private string MaskQueryString(string content)
        {
            // (?<=https?:\/\/([\w\.-_%]+\?) Starts with an http, may contain an s, must contain a :// followerd by at least one alphanumeric character including  .-_% and must end with a ? to indicate start of a query string.
            // [\w-\._&%]+) After a ?, there must be at least one alphanumeric character including - . _ & % followed by = (denoted by ?=). This matches the name part of the querystring.
            // ?=[\w-\._%]+ Repeatedly match a word (including - . _ % having at least one character that starts after an = .

            // Matches http://something.com?me=1&so=me https://something.co.uk?me=1&so=me&do=re&me=do%20something http://something.com?me=1 .
            // Does not match https://something.com? https://noQuery.com .
            string pattern = @"(?<=https?:\/\/([\w\.-_%]+\?)[\w-\._&%]+)?=[\w-\._%]+";
            return Regex.Replace(content, pattern, m => "=****", RegexOptions.IgnoreCase);
        }

        private string MaskIPV4Address(string content)
        {
            string pattern = @"(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])";
            return Regex.Replace(content, pattern, m => (m.Value.Split('.')[0] + "." + m.Value.Split('.')[1] + "." + m.Value.Split('.')[2] + ".XXX"));
        }

        private string MaskPassword(string content)
        {
            // (?<=(\bpass\b)|(\bpwd\b)|(\bpassword\b)|(\buserpass\b)) Pattern should start with either pass or pwd or password or userpass.
            // [^\w\r\n] Followed by at least one character including space but not the newline character.
            // \b[\S]+ Match an entire word that contains any character and there should be at least one character present

            /* Matches
             * pass abc@#_!(?%123 
             * pass abc@#_!(?%123
             * password abc@#_!(?%123 
             * Password : abc@#_!(?%123
             * PASS abc@#_!(?%123
             * pass abc@#_!(?%123
             * password abc@#_!(?%123 sads adasd

            Does not match
             * Pass:
             * I am doing fine :)
             */
            string pattern = @"(?<=(\bpass\b)|(\bpwd\b)|(\bpassword\b)|(\buserpass\b))[^\w\r\n]+\b[\S]+";
            return Regex.Replace(content, pattern, m => ":****", RegexOptions.IgnoreCase);
        }

        private string MaskEmails(string content)
        {
            // (?<=[\w]{1}) the name has to start with 1 word-character
            // [\w-\._\+%]* the replacement-part can contain 0-n word characters including -_.+%
            // ?=@ the name has to end with a @
            // [\w-_]+ @ should be followed by one characters which may contain _
            // [\.]{0} Presence of a . is optional. To check for emails of the form abc@gmail
            // Depending on the amount of characters you want to remain unchanged you can change {1} to {2} or something else at the beginning or at the end.

            // Matches aar9_onb@dev.com, m@text.com.in, me@t_o.dom, user@gmail, again@gmail.
            // Does not match someone@, @someone
            string pattern = @"(?<=[\w]{1})[\w-\._\+%]*(?=@([\w-_]+)[\.]{0})";
            return Regex.Replace(content, pattern, m => new string('*', m.Length));
        }

        /// <inheritdoc/>
        public string RemovePII(string content)
        {
            string currContent = content;

            currContent = MaskEmails(currContent);
            currContent = MaskPassword(currContent);
            currContent = MaskQueryString(currContent);
            currContent = MaskPhone(currContent);
            currContent = MaskIPV4Address(currContent);

            return currContent;
        }

        /// <inheritdoc/>
        public async Task<bool> LogToKusto(InternalEventBody logMessage)
        {
            try
            {
                string body = JsonConvert.SerializeObject(logMessage);
                var response = await _diagnosticClient.Execute("POST", "/internal/logger", body);
                response.EnsureSuccessStatusCode();
                return true;
            }
            catch (JsonSerializationException jsException)
            {
                throw new JsonSerializationException("FreshChatException. Failed to serialize data while sending a request to log in Kusto.", jsException);
            }
            catch (HttpRequestException hException)
            {
                throw new HttpRequestException("FreshChatException. Failed to send a log in Kusto.", hException);
            }
            catch (Exception ex)
            {
                throw new Exception("FreshChatException. Unknown exception. Review for more details.", ex);
            }
        }


        /// <summary>
        /// Initializes a new instance of the <see cref="FreshChatClientService"/> class.
        /// </summary>
        /// <param name="configuration">Will be passed via DI.</param>
        /// <param name="diagnosticClient">Will be passed via DI. Used to log messages to Kusto.</param>
        public FreshChatClientService(IConfiguration configuration, IDiagnosticClientService diagnosticClient)
        {
            LoadConfigurations(configuration);
            _diagnosticClient = diagnosticClient;
            InitializeHttpClient();
        }

        private async Task<HttpResponseMessage> MakeGetCallToFreshChat(string uriPath)
        {
            HttpResponseMessage response;
            response = await HttpClient.GetAsync(uriPath.TrimStart('/'));
            response.EnsureSuccessStatusCode();
            return response;
        }

        /// <inheritdoc />
        public bool VerifyCall(string apiKey)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return false;
            }

            return string.Compare(apiKey, this.ApplensApiKey, true) == 0;
        }
    }

    /// <summary>
    /// Cache entry for agent cache.
    /// </summary>
    public class AgentCacheEntry
    {
        public AgentDetails agent;
        public DateTime timeStamp;
    }

    /// <summary>
    /// Cache entry for user cache.
    /// </summary>
    public class UserCacheEntry
    {
        public UserDetails user;
        public DateTime timeStamp;
    }

    /// <summary>
    /// Cache entry for resourceUri cache. This cache is required because anytime a message is generated via an agent / system, the resourceURI is missing in it. We can lookup the resourceURI for a given conversationID via this.
    /// </summary>
    public class ResourceCacheEntry
    {
        public string resourceUri;
        public DateTime timeStamp;
    }
}
