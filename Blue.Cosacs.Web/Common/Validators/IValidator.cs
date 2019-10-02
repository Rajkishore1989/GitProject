using System.Web;

namespace Blue.Cosacs.Web.Common.Validators
{
	/// <summary>
	/// Base interface for validate requests
	/// </summary>
	public interface IValidator
	{

		/// <summary>
		/// Gets or sets the request to perform any adicional validation
		/// </summary>
		/// <value>
		/// an instance of <c>System.Web.HttpRequestBase</c>
		/// </value>
		HttpRequestBase Request
		{
			get;
			set;
		}
	}
}
