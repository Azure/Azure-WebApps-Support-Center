using System;
using Dapper.Contrib.Extensions;

namespace AppLensV3
{
    public static class CaseCleansingDBObjects
    {
        public class Rule
        {
            [Key]
            public int RuleId { get; set; }
            public string RuleName { get; set; }
        }

        public class Incident
        {
            public int ID { get; set; }
            public string IncidentId { get; set; }
            public DateTime ClosedTime { get; set; }
            public string DerivedProductIDStrInitial { get; set; }
            public string Title { get; set; }
        }

        [Table("Statuses")]
        public class Status
        {
            [ExplicitKey]
            public int Id { get; set; }
            public string status { get; set; }
            public DateTime Time { get; set; }
            public string AssignedTo { get; set; }
        }

        public class Recommendation
        {
            [ExplicitKey]
            public int Id { get; set; }
            [ExplicitKey]
            public int RuleID { get; set; }
            public string OldClosedAgainst { get; set; }
            public string RecommendedClosedAgainst { get; set; }
            public DateTime Date { get; set; }
        }
    }
}
