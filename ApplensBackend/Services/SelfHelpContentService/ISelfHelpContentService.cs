using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Microsoft.Extensions.Configuration;
using Octokit;
using Newtonsoft.Json;

namespace AppLensV3.Services
{
    public interface ISelfHelpContentService
    {
        Task<string[]> GetAllSelfHelp();

        Task<string> GetSelfHelpBySupportTopic(string pesId, string supportTopicId, string path);
    }
}
