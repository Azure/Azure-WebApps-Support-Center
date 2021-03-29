using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services.AppSvcUxDiagnosticDataService
{
    public interface IAppSvcUxDiagnosticDataService
    {
        Task<string[]> GetLocationPlacementIdAsync(string subscriptionId);
    }
}
