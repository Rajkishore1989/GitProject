using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using FileHelpers;

namespace Blue.Cosacs.Web.Common
{

    using Blue.Cosacs.Merchandising.Helpers;
    using Blue.Cosacs.Merchandising.Models;

    /// <summary>
    /// |Provide generic methods to read/write files using the FileHelpers library
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public abstract class BaseImportFile<T> where T : class
    {
        private static FileHelperEngine<T> CreateEngine(bool includeHeaders)
        {
            var engine = new FileHelperEngine<T>();
            if (includeHeaders)
            {
                engine.HeaderText = typeof(T).GetCsvHeader();
            }
            return engine;
        }

        public static List<T> ImportStringAndCheckForErros(string stringToRead, out List<ErrorInfo> errors)
        {
            var engine = new FileHelperEngine<T>();

            engine.ErrorManager.ErrorMode = ErrorMode.SaveAndContinue;

            var returnValue = engine.ReadString(stringToRead);

            if (engine.ErrorManager.ErrorCount > 0)
            {
                errors = engine.ErrorManager.Errors.ToList();
            }
            else
            {
                errors = null;
            }

            return returnValue.ToList();
        }

        public static List<T> ImportFileAndCheckForErros(string fileToRead, out List<ErrorInfo> errors)
        {
            var fileAsString = System.IO.File.ReadAllText(fileToRead);

            return ImportStringAndCheckForErros(fileAsString, out errors);
        }

        //public static List<T> ImportAndCheckForErros(string fileToRead, out List<ErrorInfo> errors, bool includeHeaders = false)
        //{
        //    var engine = CreateEngine(includeHeaders);
        //    engine.ErrorManager.ErrorMode = ErrorMode.SaveAndContinue;

        //    var returnValue = engine.ReadFile(fileToRead);
        //    errors = engine.ErrorManager.ErrorCount > 0 ? engine.ErrorManager.Errors.ToList() : null;

        //    return returnValue.ToList();
        //}

        public static void WriteToFile(List<T> records, string filePath, bool includeHeaders = false)
        {
            if (records != null && records.Any())
            {
                CreateEngine(includeHeaders).WriteFile(filePath, records);
            }
            else
            {
                var fileInfo = new FileInfo(filePath); // Delete if number exists (Will overwrite if numbers cycle back to 1 from 100.)

                if (fileInfo.Exists)
                {
                    fileInfo.Delete();
                }
            }
        }

        public static void WriteToStream(List<T> records, TextWriter writer, bool includeHeaders = false)
        {
            if (records != null && records.Any())
            {
                CreateEngine(includeHeaders).WriteStream(writer, records);
            }
        }

        public static string WriteToString(List<T> records, bool includeHeaders = false)
        {
            if (records != null && records.Any())
            {
                return CreateEngine(includeHeaders).WriteString(records);
            }

            return string.Empty;
        }

        public static List<T> ImportRecordByRecord(Func<T, bool> correntRecord, string fileToRead)
        {
            var returnValue = new List<T>();
            var engine = new FileHelperAsyncEngine<T>();
            engine.BeginReadFile(fileToRead);

            while (engine.ReadNext() != null)
            {
                var actualRecord = engine.LastRecord;

                if (correntRecord != null)
                {
                    if (correntRecord(actualRecord))
                        returnValue.Add(actualRecord);
                }
                else
                {
                    returnValue.Add(actualRecord);
                }
            }

            engine.Close();
            return returnValue;
        }
    }

    
}
