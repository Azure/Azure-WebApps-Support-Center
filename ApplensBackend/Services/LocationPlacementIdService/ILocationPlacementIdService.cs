using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services.LocationPlacementIdService
{
    interface ILocationPlacementIdService
    {
        Task<string[]> GetLocationPlacementIdAsync(string subscriptionId);
    }
}
