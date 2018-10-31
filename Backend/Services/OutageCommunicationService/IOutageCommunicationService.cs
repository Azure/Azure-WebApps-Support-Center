using Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IOutageCommunicationService
    {
        Task<List<Communication>> GetCommunicationsAsync(string subscription, DateTime startTime, DateTime endTime, string impactedService = "appservice");
    }
}
