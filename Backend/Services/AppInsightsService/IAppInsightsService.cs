using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IAppInsightsService
    {
        Task<bool> ConnectApplicationInsights(string resourceId, string appInsightsResource, string appInsightsAppId, string bearerToken);
    }
}
