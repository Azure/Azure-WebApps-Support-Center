using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Threading.Tasks;
using System.Web.Http;

namespace AscInsightsGeo.Controllers
{
    [RequireHttps]
    [RoutePrefix("subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers")]
    public class InsightsController : ApiController
    {
        [HttpGet]
        [Route("{provider}/{resourceType}/{resourceName}/insights")]
        public async Task<object> GetInsights(string subscriptionId, string resourceGroupName, string provider, string resourceType, string resourceName, string pesId = null, string supportTopicId = null, string supportTopic = null, string startTime = null, string endTime = null)
        {
            var client = new AppLensService();
            var insights = await client.GetInsights(subscriptionId, resourceGroupName, provider, resourceType, resourceName, pesId, supportTopicId, startTime, endTime);

            return ResponseMessage(new System.Net.Http.HttpResponseMessage
            {
                Content = insights.Content,
                StatusCode = insights.StatusCode
            });
        }
    }
}
