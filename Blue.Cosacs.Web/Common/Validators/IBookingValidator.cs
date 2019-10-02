using Blue.Cosacs.Web.Areas.Warehouse.Models;

namespace Blue.Cosacs.Web.Common.Validators
{
	/// <summary>
	/// Perform all validation need on the BookingController
	/// </summary>
	public interface IBookingValidator : IValidator
	{
		/// <summary>
		/// Validate the Cancel Request
		/// </summary>
		/// <param name="booking">An instance of <c>Blue.Cosacs.Web.Areas.Warehouse.Models.CancelBooking</c></param>
		/// <returns>
		/// Return False if there is any business error, otherwise true
		/// </returns>
		bool Cancel(CancelBooking booking);
	}
}
