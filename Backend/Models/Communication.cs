using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Models
{
    public class Communication
    {
        public string CommunicationId { get; set; }

        public DateTime PublishedTime { get; set; }

        public string Title { get; set; }

        public string RichTextMessage { get; set; }

        public CommunicationStatus Status { get; set; }

        public string IncidentId { get; set; }

        public List<ImpactedService> ImpactedServices { get; set; }

        public bool IsAlert { get; set; }

        public bool IsExpanded { get; set; }

        public Communication()
        {
            ImpactedServices = new List<ImpactedService>();
            IsAlert = false;
            IsExpanded = false;
        }
    }

    public class ImpactedService
    {
        public string Name { get; set; }

        public List<string> Regions { get; set; }

        public ImpactedService()
        {
            Regions = new List<string>();
        }
    }

    public enum CommunicationStatus
    {
        Active = 0,
        Resolved
    }

    public enum SourceType
    {
        ServiceHealth = 0,
        AppServiceAdvisor = 1
    }
}
