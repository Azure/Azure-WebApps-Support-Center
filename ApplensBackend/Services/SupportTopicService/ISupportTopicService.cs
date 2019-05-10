using AppLensV3.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface ISupportTopicService
    {
        Task<List<SupportTopic>> GetSupportTopicsAsync(string productId);
    }
}
