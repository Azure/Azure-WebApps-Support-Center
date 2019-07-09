using Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IChatService
    {
        ChatStatus GetChatStatus(string product, string supportTopic);
    }
}
