// using System;
// using System.Collections.Generic;
// using System.Data;
// using System.Linq;
// using System.Net.Http;
// using System.Net.Http.Headers;
// using System.Threading.Tasks;
// using System.Web;
// using System.Web.Http;

// namespace AppLensV3
// {
//     public class MockDiagnosticClient
//     {
//         public async Task<HttpResponseMessage> Get(string path)
//         {
//             var message = new HttpResponseMessage();

//             SignalResponse signalData = null;

//             if (path == "cpu")
//             {
//                 signalData = GetSignalResponse("CPU Percent", "This is the percent of CPU time used by this process");

//                 signalData.Data.Add(GetSignalData("CPU Percent", 6, SignalGraphType.TimeSeries));
//                 signalData.Data.Add(GetSignalData("Webjob CPU Percent", 6, SignalGraphType.Table));
//             }
//             else if (path == "frontends")
//             {
//                 signalData = GetSignalResponse("Front Ends", "This shows the list of front end roles");

//                 signalData.Data.Add(GetFrontEndData(10));
//             }

            

//             message.Content = new ObjectContent(signalData.GetType(), signalData, GlobalConfiguration.Configuration.Formatters.JsonFormatter);
//             message.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

//             return await Task.FromResult(message);
//         }

//         private SignalResponse GetSignalResponse(string name, string description)
//         {
//             var signalResponse = new SignalResponse();

//             signalResponse.MetaData = new SignalMetaData()
//             {
//                 Id = "test",
//                 Description = description,
//                 DisplayName = name
//             };

//             return signalResponse;
//         }

//         private DiagnosticData GetFrontEndData(int instanceCount)
//         {
//             var rand = new Random();

//             var columns = new List<DataTableResponseColumn>();

//             columns.Add(new DataTableResponseColumn("RoleInstance", typeof(string).Name));

//             var dataTable = new DataTableResponseObject();

//             dataTable.Columns = columns;

//             var roleInstances = new List<string>();

//             for (int i = 0; i < instanceCount; i++)
//             {
//                 roleInstances.Add(string.Format("RD{0}", rand.Next(1000000, 9999999)));
//             }

//             var rows = new List<string[]>();

//             foreach (var instance in roleInstances)
//             {
//                 rows.Add( new string[] { instance });
//             }

//             dataTable.Rows = rows.ToArray();

//             var dataAndRenderingProperties = new DiagnosticData()
//             {
//                 DataTable = dataTable,
//                 RenderingProperties = new RenderingProperties()
//                 {
//                     SignalGraphType = SignalGraphType.Table
//                 }
//             };

//             return dataAndRenderingProperties;
//         }

//         private DiagnosticData GetSignalData(string name, int instanceCount, SignalGraphType type)
//         {
//             var rand = new Random();

//             var columns = new List<DataTableResponseColumn>();

//             columns.Add(new DataTableResponseColumn("TIMESTAMP", typeof(DateTime).Name));

//             if(instanceCount > 0)
//             {
//                 columns.AddRange(new DataTableResponseColumn[]
//                 {
//                     new DataTableResponseColumn("RoleInstance", typeof(string).Name),
//                     new DataTableResponseColumn("Tenant", typeof(string).Name)
//                 });
//             }
            
//             columns.AddRange(new DataTableResponseColumn[]
//             {
//                 new DataTableResponseColumn("CounterName", typeof(string).Name),
//                 new DataTableResponseColumn("CounterValue", typeof(double).Name)
//             });

//             var dataTable = new DataTableResponseObject();

//             dataTable.Columns = columns;

//             var tenant = "TENANT1";

//             var roleInstances = new List<string>();

//             for(int i = 0; i < instanceCount; i++)
//             {
//                 roleInstances.Add(string.Format("RD{0}", rand.Next(1000000, 9999999)));
//             }

//             var rows = new List<string[]>();

//             for (var t1 = RoundDownTime(DateTime.UtcNow.AddDays(-1), TimeSpan.FromMinutes(5)); t1 < DateTime.UtcNow; t1 = t1.AddMinutes(5))
//             {
//                 if(instanceCount > 0)
//                 {
//                     foreach (var instance in roleInstances)
//                     {
//                         rows.Add(new string[] { t1.ToString("u", System.Globalization.CultureInfo.InvariantCulture), instance, tenant, name, rand.Next(0, 100).ToString() });
//                     }
//                 }
//                 else
//                 {
//                     rows.Add(new string[] { t1.ToString("u", System.Globalization.CultureInfo.InvariantCulture), name, rand.Next(0, 100).ToString() });
//                 }
//             }

//             dataTable.Rows = rows.ToArray();

//             var dataAndRenderingProperties = new DiagnosticData()
//             {
//                 DataTable = dataTable,
//                 RenderingProperties = new RenderingProperties()
//                 {
//                     SignalGraphType = type
//                 }
//             };

//             return dataAndRenderingProperties;

//         }

//         public static DateTime RoundDownTime(DateTime dateTime, TimeSpan roundDownBy)
//         {
//             return new DateTime((dateTime.Ticks / roundDownBy.Ticks) * roundDownBy.Ticks);
//         }
//     }
// }