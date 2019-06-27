using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;

namespace AppLensV3
{
    #region Enums

    /// <summary>
    /// Enum describing the different types of entities that can participate in a conversation.
    /// </summary>
    public enum ActorTypes
    {
        /// <summary>
        /// Represents a chat ambassador.
        /// </summary>
        [EnumMember(Value = "agent")]
        Agent,

        /// <summary>
        /// Represents FreshChat system.
        /// </summary>
        [EnumMember(Value = "system")]
        System,

        /// <summary>
        /// Represents a customer.
        /// </summary>
        [EnumMember(Value = "user")]
        User
    }

    /// <summary>
    /// Enum describing the different types of messages recieved in the webhook.
    /// </summary>
    public enum Actions
    {
        /// <summary>
        /// Represents that the current message is for assignment, either to an agent or to a group from which an agent can pick up the conversation to further interaction.
        /// </summary>
        [EnumMember(Value = "conversation_assignment")]
        ConversationAssignment,

        /// <summary>
        /// Represents that the current conversation is being reopened / reinitiated. This can either be a customer or a chat ambassador.
        /// </summary>
        [EnumMember(Value = "conversation_reopen")]
        ConversationReopen,

        /// <summary>
        /// Represents that the current conversation is being resolved by either the customer or the chat ambassador.
        /// </summary>
        [EnumMember(Value = "conversation_resolution")]
        ConversationResolution,

        /// <summary>
        /// Represents that a message that can be sent either be a customer or a chat ambassador.
        /// </summary>
        [EnumMember(Value = "message_create")]
        MessageCreate
    }

    /// <summary>
    /// Enum describing the type of message.
    /// </summary>
    public enum MessageTypes
    {
        /// <summary>
        /// This message is visible to all.
        /// </summary>
        [EnumMember(Value = "normal")]
        Normal,

        /// <summary>
        /// This message is hidden from the customer and is visible only to other chat ambassadors.
        /// </summary>
        [EnumMember(Value = "private")]
        Private
    }

    /// <summary>
    /// Enum representing the different parts of a message.
    /// </summary>
    public enum PartTypes
    {
        /// <summary>
        /// Represents text typed by either the customer or the chat ambassador.
        /// </summary>
        [EnumMember(Value = "text")]
        Text,

        /// <summary>
        /// Represents a URL button.
        /// </summary>
        [EnumMember(Value = "url_button")]
        UrlButton,

        /// <summary>
        /// Represents a reply button.
        /// </summary>
        [EnumMember(Value = "quick_reply_button")]
        QuickReplyButton,

        /// <summary>
        /// Represents am image shared by the customer.
        /// </summary>
        [EnumMember(Value = "image")]
        Image,

        /// <summary>
        /// Represents that the current part is a collection of part types described above.
        /// </summary>
        [EnumMember(Value = "collection")]
        Collection
    }

    /// <summary>
    /// Enum representing the state of a conversation.
    /// </summary>
    public enum StatusList
    {
        /// <summary>
        /// Indicates a new conversation.
        /// </summary>
        [EnumMember(Value = "new")]
        New,

        /// <summary>
        /// Indicates that a conversation is currently in an assigned state.
        /// </summary>
        [EnumMember(Value = "assigned")]
        Assigned,

        /// <summary>
        /// Indicates that a conversation is currently resolved.
        /// </summary>
        [EnumMember(Value = "resolved")]
        Resolved,

        /// <summary>
        /// Indicates that a conversation has been reopened.
        /// </summary>
        [EnumMember(Value = "reopened")]
        Reopened
    }

    /// <summary>
    /// Enum representing Social media profile for agents.
    /// </summary>
    public enum SocialProfileTypes
    {
        /// <summary>
        /// Profile to be treated as Facebook profile.
        /// </summary>
        [EnumMember(Value = "facebook")]
        Facebook,

        /// <summary>
        /// Profile to be treated as Twitter handle.
        /// </summary>
        [EnumMember(Value = "twitter")]
        Twitter,

        /// <summary>
        /// Profile to be treated as Skype user name.
        /// </summary>
        [EnumMember(Value = "skype")]
        Skype,

        /// <summary>
        /// Profile to be treated as Linkedin account.
        /// </summary>
        [EnumMember(Value = "linkedin")]
        Linkedin
    }

    #endregion //Enums

    /// <summary>
    /// Indicates details of the customer / chat ambassador that created a message.
    /// </summary>
    public class Actor
    {
        /// <summary>
        /// <see cref="ActorTypes"/>.
        /// </summary>
        [JsonConverter(typeof(StringEnumConverter))]
        [JsonProperty(PropertyName = "actor_type")]
        public ActorTypes ActorType;

        /// <summary>
        /// Identifier for the current Actor.
        /// </summary>
        [JsonProperty(PropertyName = "actor_Id")]
        public string ActorId;
    }

    /// <summary>
    /// Identifies a message part.
    /// </summary>
    public interface IPart
    {
        /// <summary>
        /// Indicates the type of the part. <see cref="PartTypes"/>.
        /// </summary>
        /// <returns>Identification of the current part. <see cref="PartTypes"/>.</returns>
        PartTypes GetPartTpe();
    }

    /// <summary>
    /// Represents text typed by either the customer or the chat ambassador.
    /// </summary>
    public class TextPart : IPart
    {
        /// <summary>
        /// Text content typed by customer or chat ambassador.
        /// </summary>
        [JsonProperty(PropertyName = "content", Order = 1)]
        public string Content;

        /// <inheritdoc/>
        public PartTypes GetPartTpe()
        {
            return PartTypes.Text;
        }
    }

    /// <summary>
    /// Represents a URL button.
    /// </summary>
    public class UrlButtonPart : IPart
    {
        /// <summary>
        /// Label describing the URL button.
        /// </summary>
        [JsonProperty(PropertyName = "label")]
        public string Label;

        /// <summary>
        /// URL that the button is pointing to.
        /// </summary>
        [JsonProperty(PropertyName = "url")]
        public string Url;


        /// <summary>
        /// Target property of href.
        /// </summary>
        [JsonProperty(PropertyName = "target")]
        public string Target;

        /// <inheritdoc/>
        public PartTypes GetPartTpe()
        {
            return PartTypes.UrlButton;
        }
    }

    /// <summary>
    /// Represents a reply button.
    /// </summary>
    public class QuickReplyButtonPart : IPart
    {
        /// <summary>
        /// Label describing the button.
        /// </summary>
        [JsonProperty(PropertyName = "label")]
        public string Label;

        /// <summary>
        /// Custom reply text associated with the button.
        /// </summary>
        [JsonProperty(PropertyName = "custom_reply_text")]
        public string CustomReplyText;

        /// <inheritdoc/>
        public PartTypes GetPartTpe()
        {
            return PartTypes.QuickReplyButton;
        }
    }

    /// <summary>
    /// Represents am image shared by the customer.
    /// </summary>
    public class ImagePart : IPart
    {
        /// <summary>
        /// URK where the image is stored.
        /// </summary>
        [JsonProperty(PropertyName = "url")]
        public string Url;

        /// <inheritdoc/>
        public PartTypes GetPartTpe()
        {
            return PartTypes.Image;
        }
    }

    /// <summary>
    /// Represents that the current part is a collection of other part types.
    /// </summary>
    public class CollectionPart : IPart
    {
        /// <summary>
        /// Collection of Parts. <see cref="PartTypes"/>.
        /// </summary>
        [JsonProperty(PropertyName = "sub_parts")]
        public List<MessagePart> SubParts;

        /// <inheritdoc/>
        public PartTypes GetPartTpe()
        {
            return PartTypes.Collection;
        }

    }

    /// <summary>
    /// Describes a message.
    /// </summary>
    public class MessagePart
    {
        /// <summary>
        /// <see cref="TextPart"/>.
        /// </summary>
        [JsonProperty(PropertyName = "text")]
        public TextPart Text;

        /// <summary>
        /// <see cref="ImagePart"/>.
        /// </summary>
        [JsonProperty(PropertyName = "image")]
        public ImagePart Image;

        /// <summary>
        /// <see cref="UrlButtonPart"/>.
        /// </summary>
        [JsonProperty(PropertyName = "url_button")]
        public UrlButtonPart UrlButton;

        /// <summary>
        /// <see cref="QuickReplyButtonPart"/>.
        /// </summary>
        [JsonProperty(PropertyName = "quick_reply_button")]
        public QuickReplyButtonPart QuickReplyButton;

        /// <summary>
        /// <see cref="CollectionPart"/>.
        /// </summary>
        [JsonProperty(PropertyName = "collection")]
        public CollectionPart Collection;
    }

    /// <summary>
    /// Describes a FreshChat message.
    /// </summary>
    public class Message
    {
        /// <summary>
        /// Different message parts that make up a current Fresh Chat message. <see cref="MessagePart"/>.
        /// </summary>
        [JsonProperty(PropertyName = "message_parts")]
        public List<MessagePart> MsgParts;

        /// <summary>
        /// Different message parts that make up a reply of the current Fresh Chat message. <see cref="MessagePart"/>.
        /// </summary>
        [JsonProperty(PropertyName = "reply_parts")]
        public List<MessagePart> ReplyParts;

        /// <summary>
        /// Unique identifier.
        /// </summary>
        [JsonProperty(PropertyName = "app_id")]
        public string AppId;

        /// <summary>
        /// Id of either a user or a chat ambassador that created this message.
        /// </summary>
        [JsonProperty(PropertyName = "actor_id")]
        public string ActorId;

        /// <summary>
        /// Id of the message.
        /// </summary>
        [JsonProperty(PropertyName = "id")]
        public string Id;

        /// <summary>
        /// The Channel to which this conversation is associated with.
        /// </summary>
        [JsonProperty(PropertyName = "channel_id")]
        public string ChannelId;

        /// <summary>
        /// Identifier of the concersation of which this message is a part of.
        /// </summary>
        [JsonProperty(PropertyName = "conversation_id")]
        public string ConversationId;

        /// <summary>
        /// <see cref="MessageTypes"/>.
        /// </summary>
        [JsonConverter(typeof(StringEnumConverter))]
        [JsonProperty(PropertyName = "message_type")]
        public MessageTypes MessageType;

        /// <summary>
        /// <see cref="ActorTypes"/>.
        /// </summary>
        [JsonConverter(typeof(StringEnumConverter))]
        [JsonProperty(PropertyName = "actor_type")]
        public ActorTypes ActorType;

        /// <summary>
        /// Timestamp when this message was created.
        /// </summary>
        [JsonProperty(PropertyName = "created_time")]
        public DateTime CreatedTime;
    }

    /// <summary>
    /// Payload a message that either a customer or a chat ambassador types.
    /// </summary>
    public class MessageCreateData : IData
    {
        /// <summary>
        /// <see cref="Message"/>.
        /// </summary>
        [JsonProperty(PropertyName = "message", Order = 1)]
        public Message Message;
    }

    /// <summary>
    /// Details of the current conversation.
    /// </summary>
    public class ConversationDetails : IData
    {
        /// <summary>
        /// Unique identifier of the conversation.
        /// </summary>
        [JsonProperty(PropertyName = "conversation_id")]
        public string ConversationId;


        /// <summary>
        /// Identifier for the current FreshChat application.
        /// </summary>
        [JsonProperty(PropertyName = "app_id")]
        public string AppId;

        /// <summary>
        /// <see cref="StatusList"/>
        /// </summary>
        [JsonProperty(PropertyName = "status")]
        public StatusList Status;

        /// <summary>
        /// Identifier of the agent to whom this conversation is assigned to.
        /// </summary>
        [JsonProperty(PropertyName = "assigned_agent_id")]
        public string AssignedAgentId;

        /// <summary>
        /// Identifier of the group to which this conversation is assigned to.
        /// </summary>
        [JsonProperty(PropertyName = "assigned_group_id")]
        public string AssignedGroupId;

        /// <summary>
        /// Identifier of the channel to which this conversation is associated with.
        /// </summary>
        [JsonProperty(PropertyName = "channel_id")]
        public string ChannelId;
    }

    /// <summary>
    /// Class providing details on who reopened a given chat conversation. 
    /// </summary>
    public class ReopenDetails
    {
        /// <summary>
        /// Identifies who reopened a chat. <see cref="ActorTypes"/>.
        /// </summary>
        [JsonProperty(PropertyName = "reopener")]
        public ActorTypes Reopener;

        /// <summary>
        /// Identifier of the reopener.
        /// </summary>
        [JsonProperty(PropertyName = "reopener_id")]
        public string ReopenerId;

        /// <summary>
        /// <see cref="ConversationDetails"/>.
        /// </summary>
        [JsonProperty(PropertyName = "conversation")]
        public ConversationDetails Conversation;
    }

    /// <summary>
    /// Message body when a conversation is reopened.
    /// </summary>
    public class ConvReopenData :IData
    {
        /// <summary>
        /// <see cref="ReopenDetails"/>.
        /// </summary>
        [JsonProperty(PropertyName = "reopen")]
        public ReopenDetails Reopen;
    }

    /// <summary>
    /// Class providing details on who resolved a given chat conversation.
    /// </summary>
    public class ResolveDetails
    {
        /// <summary>
        /// Identifies who resolved a conversation. <see cref="ActorTypes"/>.
        /// </summary>
        [JsonProperty(PropertyName = "resolver")]
        public ActorTypes Resolver;

        /// <summary>
        /// Identifier of the resolver.
        /// </summary>
        [JsonProperty(PropertyName = "resolver_id")]
        public string ResolverId;

        /// <summary>
        /// <see cref="Conversation"/>.
        /// </summary>
        [JsonProperty(PropertyName = "conversation")]
        public ConversationDetails Conversation;
    }

    /// <summary>
    /// Message body when a conversation is resolved.
    /// </summary>
    public class ConvResolutionData : IData
    {
        /// <summary>
        /// <see cref="ResolveDetails"/>.
        /// </summary>
        [JsonProperty(PropertyName = "resolve")]
        public ResolveDetails Resolve;
    }

    /// <summary>
    /// Class providing details when a conversation is assigned to an agent or to a group.
    /// </summary>
    public class AssignmentDetails
    {
        /// <summary>
        /// Identified who assigned the conversation. <see cref="ActorTypes"/>.
        /// </summary>
        [JsonProperty(PropertyName = "assignor")]
        public ActorTypes Assignor;

        /// <summary>
        /// Identifier of the assignor.
        /// </summary>
        [JsonProperty(PropertyName = "assignor_id")]
        public string AssignorId;

        /// <summary>
        /// Identifier of the agent to whom the conversation was assigned to.
        /// </summary>
        [JsonProperty(PropertyName = "to_agent_id")]
        public string ToAgentId;

        /// <summary>
        /// Identifier of the group that the conversation was assigned to.
        /// </summary>
        [JsonProperty(PropertyName = "to_group_id")]
        public string ToGroupId;

        /// <summary>
        /// Previous owner of the chat conversation.
        /// </summary>
        [JsonProperty(PropertyName = "from_agent_id")]
        public string FromAgentId;

        /// <summary>
        /// Previous group that the chat conversation was a part of.
        /// </summary>
        [JsonProperty(PropertyName = "from_group_id")]
        public string FromGroupId;

        /// <summary>
        /// <see cref="ConversationDetails"/>.
        /// </summary>
        [JsonProperty(PropertyName = "conversation")]
        public ConversationDetails Conversation;
    }

    /// <summary>
    /// Class describing details of when a conversation is assigned.
    /// </summary>
    public class ConvAssignmentData:IData
    {
        /// <summary>
        /// <see cref="AssignmentDetails"/>.
        /// </summary>
        [JsonProperty(PropertyName = "assignment")]
        public AssignmentDetails Assignment;
    }

    /// <summary>
    /// Marker interface.
    /// </summary>
    public interface IData
    { }

    /// <summary>
    /// Incomming payload on the webhook.
    /// </summary>
    public class FreshChatPayload
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="FreshChatPayload"/> class.
        /// To be used only for Deserialization. For use in code, initialize an with Action.
        /// </summary>
        public FreshChatPayload()
        {
            this.Data = null;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="FreshChatPayload"/> class initializing the type of message in payload.
        /// Use only this contructor in code. Default constructor is for deserialization only.
        /// </summary>
        public FreshChatPayload(Actions action)
        {
            this.Action = action;
        }

        /// <summary>
        /// <see cref="Actor"/>.
        /// </summary>
        [JsonProperty(PropertyName = "actor", Order = 1)]
        public Actor Actor;

        /// <summary>
        /// <see cref="Actions"/>.
        /// </summary>
        private Actions _action;

        /// <summary>
        /// <see cref="Actions"/>.
        /// </summary>
        [JsonProperty(PropertyName = "action", Order = 2)]
        public Actions Action {
            get {
                return _action;
            }

            set {
                this._action = value;
                if (this.Data == null)
                {
                    switch (this._action)
                    {
                        case Actions.MessageCreate:
                            this.Data = new MessageCreateData();
                            break;
                        case Actions.ConversationReopen:
                            this.Data = new ConvReopenData();
                            break;
                        case Actions.ConversationResolution:
                            this.Data = new ConvResolutionData();
                            break;
                        default:
                            this.Data = new ConvAssignmentData();
                            break;
                    }
                }
            }
        }

        /// <summary>
        /// Timestamp of when the chat conversation action was initiated.
        /// </summary>
        [JsonProperty(PropertyName = "action_time", Order = 3)]
        public DateTime ActionTime;

        /// <summary>
        /// Content of the chat message depending on the <see cref="Actions"/>.
        /// </summary>
        [JsonProperty(PropertyName = "data", Order = 4)]
        public IData Data;
    }

    /// <summary>
    /// URL for Avatar.
    /// </summary>
    public class Avatar
    {
        /// <summary>
        /// URL pointing to the avatar image.
        /// </summary>
        [JsonProperty(PropertyName = "url")]
        public string Url;
    }

    /// <summary>
    /// Describes social media profile information.
    /// </summary>
    public class SocialProfile
    {
        /// <summary>
        /// <see cref="SocialProfileTypes"/>.
        /// </summary>
        [JsonConverter(typeof(StringEnumConverter))]
        [JsonProperty(PropertyName = "type")]
        public SocialProfileTypes Type;


        /// <summary>
        /// Identifier for the social profile.
        /// </summary>
        [JsonProperty(PropertyName = "id")]
        public string Id;
    }

    /// <summary>
    /// Base class for User or Agent details.
    /// </summary>
    public class PersonDetails
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="PersonDetails"/> class.
        /// </summary>
        /// <param name="type"><see cref="ActorTypes"/>.</param>
        public PersonDetails(ActorTypes type)
        {
            this.PersonType = type;
        }

        /// <summary>
        /// Unique identifier for the Agent / User.
        /// </summary>
        [JsonProperty(PropertyName = "id")]
        public string Id;

        /// <summary>
        /// Email ID.
        /// </summary>
        [JsonProperty(PropertyName = "email")]
        public string Email;

        /// <summary>
        /// <see cref="Avatar"/>.
        /// </summary>
        [JsonProperty(PropertyName = "avatar")]
        public Avatar Avatar;

        /// <summary>
        /// Phone number.
        /// </summary>
        [JsonProperty(PropertyName = "phone")]
        public string Phone;

        /// <summary>
        /// First Name.
        /// </summary>
        [JsonProperty(PropertyName = "first_name")]
        public string FirstName;

        /// <summary>
        /// Last Name.
        /// </summary>
        [JsonProperty(PropertyName = "last_name")]
        public string LastName;

        /// <summary>
        /// A list of all social profiles <see cref="SocialProfiles"/>.
        /// </summary>
        [JsonProperty(PropertyName = "social_profiles")]
        public List<SocialProfile> SocialProfiles;

        /// <summary>
        /// <see cref="ActorTypes"/>.
        /// </summary>
        [JsonConverter(typeof(StringEnumConverter))]
        public ActorTypes PersonType;
    }

    /// <summary>
    /// Class representing agent information.
    /// </summary>
    public class AgentDetails : PersonDetails
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="AgentDetails"/> class.
        /// </summary>
        public AgentDetails()
            : base(ActorTypes.Agent)
        {
        }

        /// <summary>
        /// Biography of the user.
        /// </summary>
        [JsonProperty(PropertyName = "biography")]
        public string Biography;
    }

    /// <summary>
    /// Key Value pair of custom user properties.
    /// </summary>
    public class UserDetailsProperties
    {
        [JsonProperty(PropertyName = "name")]
        public string Name;

        [JsonProperty(PropertyName = "value")]
        public string Value;
    }

    /// <summary>
    /// Class representing agent information.
    /// </summary>
    public class UserDetails : PersonDetails
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="UserDetails"/> class.
        /// </summary>
        public UserDetails()
            : base(ActorTypes.User)
        {
        }

        /// <summary>
        /// Contains the ARM URI of the resource for which the current converstaion was started.
        /// </summary>
        [JsonProperty(PropertyName = "reference_id")]
        public string ReferenceId;

        /// <summary>
        /// When this user was created.
        /// </summary>
        [JsonProperty(PropertyName = "created_time")]
        public DateTime CreatedTime;

        /// <summary>
        /// A collection of a Key Value pair of custom peroperties for a user.
        /// </summary>
        [JsonProperty(PropertyName = "properties")]
        public List<UserDetailsProperties> Properties;
    }

    /// <summary>
    /// Class representing what message will be logged in Kusto after processing the incoming payload.
    /// </summary>
    public class ChatMessageToLog
    {
        /// <summary>
        /// Initializes a new instance of <see cref="ChatMessageToLog"/> class.
        /// </summary>
        public ChatMessageToLog()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="ChatMessageToLog"/> class setting a few properties by default.
        /// </summary>
        /// <param name="id">Message ID of the incoming payload.</param>
        /// <param name="channelId">Channel to which the current chat is associated with.</param>
        /// <param name="conversationId">Conversation to which this message belongs to.</param>
        /// <param name="messageType"><see cref="MessageTypes"/>.</param>
        /// <param name="timeStamp">Timestamp when the message was created in Freshchat system.</param>        
        public ChatMessageToLog(string id, string channelId, string conversationId, DateTime timeStamp, MessageTypes messageType)
        {
            this.Id = id;
            this.ChannelId = channelId;
            this.ConversationId = conversationId;
            this.MessageType = messageType;
            this.TimeStamp = timeStamp;
            this.TimeInMilliSeconds = TimeInMilliSeconds;
        }

        // ARM resource uri associated with the chat.
        public string ResourceUri { get; set; }

        /// <summary>
        /// Message ID of the incoming payload.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Channel to which the current chat is associated with.
        /// </summary>
        public string ChannelId { get; set; }

        /// <summary>
        /// Conversation to which this message belongs to.
        /// </summary>
        public string ConversationId { get; set; }

        /// <summary>
        /// Details of the creator of a message.
        /// </summary>
        public PersonDetails Sender { get; set; }

        /// <summary>
        /// <see cref="MessageTypes"/>.
        /// </summary>
        [JsonConverter(typeof(StringEnumConverter))]
        public MessageTypes MessageType { get; set; }

        /// <summary>
        /// Timestamp when the message was created in Freshchat system.
        /// </summary>
        public DateTime TimeStamp { get; set; }

        /// <summary>
        /// Extracted Text content that was sent as a part of this message.
        /// </summary>
        public List<string> TextContent { get; set; }

        /// <summary>
        /// Extracted Images that were shared on the message.
        /// </summary>
        public List<string> ImageUrls { get; set; }

        /// <summary>
        /// Time it took in milliseconds to process the webhook payload and create this log message.
        /// </summary>
        public double TimeInMilliSeconds { get; set; }
    }

    /// <summary>
    /// Defines the structure to use when sending the message to be logged in Kusto.
    /// </summary>
    public class InternalEventBody
    {
        /// <summary>
        /// Gets or sets EventType. Will be logged under EventId 4000 in the DiagnosticRole kusto table.
        /// </summary>
        public string EventType { get; set; }

        /// <summary>
        /// Gets or sets EventContent.
        /// </summary>
        public string EventContent { get; set; }
    }
}
