using AppLensV3.Helpers;
using AppLensV3.Models;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AppLensV3.Attributes;
using Newtonsoft.Json;
using System.Net.Http;

namespace AppLensV3.Controllers
{
    [Route("api/freshchat")]
    [FreshChatAuth()]
    public class FreshChatController: ControllerBase
    {
        private readonly IFreshChatClientService _freshChatClientService;

        /// <summary>
        /// Initializes a new instance of the <see cref="FreshChatController"/> class.
        /// </summary>
        /// <param name="freshChatClientService">Will be injected by DI.</param>
        public FreshChatController(IFreshChatClientService freshChatClientService)
        {
            _freshChatClientService = freshChatClientService;
        }

        private List<string> ExtractAllTextContent(List<MessagePart> msgParts)
        {
            List<string> textContent = new List<string>();
            if (msgParts != null && msgParts.Count > 0)
            {
                foreach (MessagePart currPart in msgParts)
                {
                    textContent.AddRange(ExtractAllTextContent(currPart));
                }
            }

            return textContent;
        }

        private List<string> ExtractAllTextContent(MessagePart msgPart)
        {
            List<string> textContent = new List<string>();
            if (msgPart.Text != null)
            {
                textContent.Add(_freshChatClientService.RemovePII(msgPart.Text.Content));
            }

            if (msgPart.Collection != null && msgPart.Collection.SubParts.Count > 0)
            {
                foreach (MessagePart currPart in msgPart.Collection.SubParts)
                {
                    textContent.AddRange(ExtractAllTextContent(currPart));
                }
            }

            return textContent;
        }

        private List<string> ExtractAllImageUrls(List<MessagePart> msgParts)
        {
            List<string> imageUrl = new List<string>();

            if (msgParts != null && msgParts.Count > 0)
            {
                foreach (MessagePart currPart in msgParts)
                {
                    imageUrl.AddRange(ExtractAllImageUrls(currPart));
                }
            }

            return imageUrl;
        }

        private List<string> ExtractAllImageUrls(MessagePart msgPart)
        {
            List<string> imageUrl= new List<string>();
            if (msgPart.Image != null)
            {
                imageUrl.Add(msgPart.Image.Url);
            }

            if (msgPart.Collection != null && msgPart.Collection.SubParts.Count > 0)
            {
                foreach (MessagePart currPart in msgPart.Collection.SubParts)
                {
                    imageUrl.AddRange(ExtractAllImageUrls(currPart));
                }
            }

            return imageUrl;
        }

        /// <summary>
        /// Gets the details of Agent / User if present in cache and if not, then gets it via the FreshChat API call.
        /// </summary>
        /// <param name="senderId">Identifier indicating who created the message.</param>
        /// <param name="senderType">Type of entity that created the message. See <see cref="ActorTypes"/>.</param>
        /// <param name="conversationId">ConversationId for the current message.</param>
        /// <returns>Details of the Agent / User that created the message. <seealso cref="PersonDetails"/>.</returns>
        public async Task<PersonDetails> GetMessageSenderDetails(string senderId, ActorTypes senderType, string conversationId = null)
        {
            PersonDetails currSender = null;
            if (senderType == ActorTypes.System)
            {
                currSender = new UserDetails();
                currSender.Id = senderId;
                currSender.FirstName = "System";
                currSender.LastName = string.Empty;
                currSender.Email = string.Empty;
                return currSender;
            }
            else
            {
                if (senderType == ActorTypes.Agent)
                {
                    currSender = await _freshChatClientService.GetAgentDetails(senderId);
                }
                else
                {
                    if (senderType == ActorTypes.User)
                    {
                        currSender = await _freshChatClientService.GetUserDetails(senderId, conversationId);
                    }
                }

                return currSender;
            }
        }

        /// <summary>
        /// Action for freshchat webhook.
        /// </summary>
        /// <param name="body">Request body.</param>
        /// <returns>Task for handling freshchat webhook.</returns>
        [HttpPost("chatHook")]
        public async Task<IActionResult> ChatHook([FromBody]JToken body)
        {
            if (body != null)
            {
                try
                {
                    DateTime startTime = DateTime.Now;
                    FreshChatPayload incomingPayload = incomingPayload = body.ToObject<FreshChatPayload>();
                    ChatMessageToLog logMsg = null;
                    InternalEventBody kustoLog = new InternalEventBody();
                    switch (incomingPayload.Action)
                    {
                        case Actions.MessageCreate:
                            MessageCreateData msgData = (MessageCreateData) incomingPayload.Data;

                            logMsg = new ChatMessageToLog(msgData.Message.Id, msgData.Message.ChannelId, msgData.Message.ConversationId, msgData.Message.CreatedTime, msgData.Message.MessageType);

                            logMsg.Sender = await GetMessageSenderDetails(msgData.Message.ActorId, msgData.Message.ActorType, logMsg.ConversationId);
                            logMsg.ResourceUri = _freshChatClientService.GetResourceUri(logMsg.ConversationId);

                            if (msgData.Message.MsgParts != null && msgData.Message.MsgParts.Count > 0)
                            {
                                logMsg.TextContent = ExtractAllTextContent(msgData.Message.MsgParts);
                                logMsg.ImageUrls = ExtractAllImageUrls(msgData.Message.MsgParts);
                            }

                            if (msgData.Message.ReplyParts != null && msgData.Message.ReplyParts.Count > 0)
                            {
                                logMsg.TextContent = ExtractAllTextContent(msgData.Message.ReplyParts);
                                logMsg.ImageUrls = ExtractAllImageUrls(msgData.Message.ReplyParts);
                            }

                            break;
                        case Actions.ConversationReopen:
                            ReopenDetails reopenData = ((ConvReopenData) incomingPayload.Data).Reopen;

                            logMsg = new ChatMessageToLog(string.Empty, reopenData.Conversation.ChannelId, reopenData.Conversation.ConversationId, incomingPayload.ActionTime, MessageTypes.Private);

                            logMsg.TextContent = new List<string>();
                            logMsg.Sender = await GetMessageSenderDetails(reopenData.ReopenerId, reopenData.Reopener, logMsg.ConversationId);
                            logMsg.ResourceUri = _freshChatClientService.GetResourceUri(logMsg.ConversationId);

                            logMsg.TextContent.Add($"Conversation re-opened by {reopenData.Reopener.ToString()}.");
                            break;
                        case Actions.ConversationAssignment:
                            AssignmentDetails assignmentData = ((ConvAssignmentData)incomingPayload.Data).Assignment;

                            logMsg = new ChatMessageToLog(string.Empty, assignmentData.Conversation.ChannelId, assignmentData.Conversation.ConversationId, incomingPayload.ActionTime, MessageTypes.Private);

                            string assignedToDetails = string.Empty;
                            if (string.IsNullOrWhiteSpace(assignmentData.Conversation.AssignedAgentId))
                            {
                                // Conversation assigned to a group and waiting to be assigned to an agent
                                logMsg.Sender = await GetMessageSenderDetails(string.IsNullOrWhiteSpace(incomingPayload.Actor.ActorId) ? assignmentData.Conversation.AssignedGroupId : incomingPayload.Actor.ActorId, incomingPayload.Actor.ActorType, logMsg.ConversationId);
                                logMsg.ResourceUri = _freshChatClientService.GetResourceUri(logMsg.ConversationId);

                                assignedToDetails = " to group";
                            }
                            else
                            {
                                // Conversation assigned to an agent.
                                logMsg.Sender = await GetMessageSenderDetails(string.IsNullOrWhiteSpace(incomingPayload.Actor.ActorId) ? assignmentData.Conversation.AssignedGroupId : incomingPayload.Actor.ActorId, incomingPayload.Actor.ActorType, logMsg.ConversationId);
                                logMsg.ResourceUri = _freshChatClientService.GetResourceUri(logMsg.ConversationId);

                                PersonDetails assignedAgent = await GetMessageSenderDetails(assignmentData.Conversation.AssignedAgentId, ActorTypes.Agent, logMsg.ConversationId);
                                assignedToDetails = $" to agent {assignedAgent.FirstName} {assignedAgent.LastName} ({assignedAgent.Email})";
                            }

                            logMsg.TextContent = new List<string>();
                            logMsg.TextContent.Add($"Conversation assigned {assignedToDetails}.");
                            break;
                        case Actions.ConversationResolution:
                            ResolveDetails resolveData = ((ConvResolutionData) incomingPayload.Data).Resolve;

                            logMsg = new ChatMessageToLog(string.Empty, resolveData.Conversation.ChannelId, resolveData.Conversation.ConversationId, incomingPayload.ActionTime, MessageTypes.Private);

                            logMsg.Sender = await GetMessageSenderDetails(resolveData.ResolverId, resolveData.Resolver, logMsg.ConversationId);
                            logMsg.ResourceUri = _freshChatClientService.GetResourceUri(logMsg.ConversationId);

                            logMsg.TextContent = new List<string>();
                            logMsg.TextContent.Add($"Conversation resolved by {resolveData.Resolver.ToString()}.");
                            break;
                        default:
                            kustoLog.EventType = "FreshChatLoggingUnhandledException";

                            // Remove PII function will likely garble the text body and make the object non serializable however it will be helpful for a human to debug the problem.
                            kustoLog.EventContent = $"FreshChatException. Unhandled message type {incomingPayload.Action.ToString()}. Unable to handle. Body : {_freshChatClientService.RemovePII(JsonConvert.SerializeObject(body))}";
                            _freshChatClientService.LogToKusto(kustoLog);

                            throw new Exception($"FreshChatException. Unhandled message type {incomingPayload.Action.ToString()}. Unable to handle.");
                    }

                    if (logMsg == null)
                    {
                        return new BadRequestResult();
                    }
                    else
                    {
                        logMsg.TimeInMilliSeconds = DateTime.Now.Subtract(startTime).TotalMilliseconds;

                        kustoLog.EventType = "FreshChatMessage";
                        kustoLog.EventContent = JsonConvert.SerializeObject(logMsg);
                        _freshChatClientService.LogToKusto(kustoLog);

                        return Content(JsonConvert.SerializeObject(logMsg));
                    }
                }
                catch (JsonSerializationException sException)
                {
                    InternalEventBody kustoLog = new InternalEventBody();
                    kustoLog.EventType = "FreshChatLoggingUnhandledException";

                    // Remove PII function will likely garble the text body and make the object non serializable however it will be helpful for a human to debug the problem.
                    kustoLog.EventContent = JsonConvert.SerializeObject(new JsonSerializationException("FreshChatException. Failed to deserialize the incoming data.", sException));
                    _freshChatClientService.LogToKusto(kustoLog);

                    throw new JsonSerializationException("FreshChatException. Failed to deserialize the incoming data.", sException);
                }
                catch (Exception ex)
                {
                    InternalEventBody kustoLog = new InternalEventBody();
                    kustoLog.EventType = "FreshChatLoggingUnhandledException";

                    // Remove PII function will likely garble the text body and make the object non serializable however it will be helpful for a human to debug the problem.
                    kustoLog.EventContent = JsonConvert.SerializeObject(new ArgumentException("FreshChatException. Unknwon error while trying to read the incoming post body ", ex));
                    _freshChatClientService.LogToKusto(kustoLog);

                    throw new ArgumentException("FreshChatException. Unknwon error while trying to read the incoming post body ", ex);
                }
            }
            else
            {
                return BadRequest("Empty post body");
            }
        }

    }
}
