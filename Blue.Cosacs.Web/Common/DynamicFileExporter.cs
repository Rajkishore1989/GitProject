using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Blue.Cosacs.Web.Common
{
    using System.Dynamic;

    public abstract class DynamicFileExporter
    {
        public static void WriteToStream(List<ExpandoObject> records, TextWriter writer, string delimiter, bool includeHeaders = false)
        {
            if (records != null && records.Any())
            {
                if (records.All(r => r.Count() != records[0].Count()))
                {
                    throw new ArgumentException("Supplied records have differing numbers of properties");
                }

                if (includeHeaders)
                {
                    foreach (var header in records[0])
                    {
                        writer.Write(header.Key);
                        writer.Write(delimiter);
                    }
                    writer.WriteLine();
                }

                foreach (var record in records)
                {
                    foreach (var property in record)
                    {
                        writer.Write(property.Value);
                        writer.Write(delimiter);
                    }
                    writer.WriteLine();
                }
            }
        }
    }
}
