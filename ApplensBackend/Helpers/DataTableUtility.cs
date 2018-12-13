using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;

namespace AppLensV3
{
    internal static class DataTableUtility
    {
        internal static DataTable GetDataTable(DataTableResponseObject dataTableResponse)
        {
            if (dataTableResponse == null)
            {
                throw new ArgumentNullException("kustoDataTable");
            }

            var dataTable = new DataTable(dataTableResponse.TableName);

            dataTable.Columns.AddRange(dataTableResponse.Columns.Select(column => new DataColumn(column.ColumnName, GetColumnType(column.ColumnType, column.DataType))).ToArray());

            foreach (var row in dataTableResponse.Rows)
            {
                var rowWithCorrectTypes = new List<object>();
                for (int i = 0; i < dataTable.Columns.Count; i++)
                {
                    object rowValueWithCorrectType = null;

                    if (row[i] != null)
                    {
                        rowValueWithCorrectType = Convert.ChangeType(row[i], dataTable.Columns[i].DataType);
                    }

                    rowWithCorrectTypes.Add(rowValueWithCorrectType);
                }

                dataTable.Rows.Add(rowWithCorrectTypes.ToArray());
            }

            return dataTable;
        }

        internal static Type GetColumnType(string type, string datatype)
        {
            return Type.GetType($"System.{datatype}");
        }
    }
}