using System;

namespace Blue.Cosacs.Web.Common
{
    public class TooManyResultsException : Exception
    {
        public TooManyResultsException(string message) : base(message) { }
    }
}