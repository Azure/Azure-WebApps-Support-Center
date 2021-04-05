using AppLensV3.Models;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface IResourceConfigService
    {
        Task<ResourceConfig> GetResourceConfig(string resourceType);
    }
}
