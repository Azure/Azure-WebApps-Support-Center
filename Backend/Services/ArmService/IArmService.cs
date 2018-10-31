using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IArmService
    {
        Task<bool> CheckSubscriptionAccessAsync(string subscriptionId, string bearerToken);
    }
}
