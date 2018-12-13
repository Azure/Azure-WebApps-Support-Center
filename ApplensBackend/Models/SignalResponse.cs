using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AppLensV3
{
    public class SignalResponse
    {
        public SignalMetaData MetaData { get; set; }

        public List<DiagnosticData> Data { get; set; }

        public SignalResponse()
        {
            MetaData = new SignalMetaData();
            Data = new List<DiagnosticData>();
        }
    }

    public class DiagnosticData
    {
        public DataTableResponseObject DataTable { get; set; }

        public RenderingProperties RenderingProperties { get; set; }

        public DiagnosticData()
        {
            DataTable = new DataTableResponseObject();
            RenderingProperties = new RenderingProperties();
        }
    }

    public class SignalMetaData
    {
        public string Id { get; set; }

        public string DisplayName { get; set; }

        public string Description { get; set; }
    }

    public class RenderingProperties
    {
        public SignalGraphType SignalGraphType { get; set; }
    }

    public enum SignalGraphType
    {
        NoGraph = 0,
        Table,
        TimeSeries
    }
}