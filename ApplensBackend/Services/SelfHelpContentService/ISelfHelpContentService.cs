using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface ISelfHelpContentService
    {
        Task<string> GetSelfHelpContentAsync(string pesId, string supportTopicId);
    }
}
