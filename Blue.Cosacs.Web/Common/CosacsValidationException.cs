using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Blue.Cosacs.Web.Common
{
	/// <summary>
	///  Represents errors that occur during application execution.
	/// </summary>
	/// <remarks>
	/// Used to throw error when the request reach the server with invalid data that should be already been validated by the javascript
	/// </remarks>
	[Serializable]
	public sealed class CosacsValidationException : System.Exception
	{
		private const string DEFAULT_MESSAGE = "One or more parameters are invalid.";

		/// <summary>
		/// Initializes a new instance of the <see cref="CosacsValidationException"/> class.
		/// </summary>
		public CosacsValidationException() : this(DEFAULT_MESSAGE)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="CosacsValidationException"/> class.
		/// </summary>
		/// <param name="errorMessage">The error message.</param>
		public CosacsValidationException(string errorMessage) : base(errorMessage)
		{
		}
	}
}