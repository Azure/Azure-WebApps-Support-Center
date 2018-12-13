using System.Net.Http;
using System.Threading.Tasks;

namespace AppLensV3
{
    public interface IObserverClientService
    {
        Task<ObserverResponse> GetSite(string siteName);

        Task<ObserverResponse> GetSite(string stamp, string siteName);

        Task<ObserverResponse> GetResourceGroup(string site);

        Task<ObserverResponse> GetStamp(string siteName);

        Task<ObserverResponse> GetHostnames(string siteName);

        Task<ObserverResponse> GetHostingEnvironmentDetails(string hostingEnvironmentName);

        Task<ObserverResponse> GetHostingEnvironmentPostBody(string name);

        Task<ObserverResponse> GetSitePostBody(string stamp, string site);
    }
}