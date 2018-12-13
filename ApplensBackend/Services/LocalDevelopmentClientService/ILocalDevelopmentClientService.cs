using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;

namespace AppLensV3
{
    public interface ILocalDevelopmentClientService
    {
         Task<string> PrepareLocalDevelopment(string detectorId = null, string scriptBody = null, string resourceId = null);
    }
}