using AppLensV3.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3
{
    public interface IGithubClientService
    {
        Task<string> GetRawFile(string url);

        Task<GithubEntry> Get(string url);

        Task<string> GetDetectorFile(string detectorId);

        Task Publish(Package pkg);
    }
}
