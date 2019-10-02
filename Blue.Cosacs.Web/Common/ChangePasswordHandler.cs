using Blue.Admin;
using Blue.Admin.Password;

namespace Blue.Cosacs.Web.Common
{
	internal class ChangePasswordHandler
	{
		internal ChangePasswordResult HandleChangePassword<t>(string username, string newPassword, t validator) where t : BaseChangePassword
		{
			return HandleChangePassword(
				UserRepository.GetUserByLogin(username), 
				newPassword,
				validator);
		}

		internal ChangePasswordResult HandleChangePassword<t>(Blue.Admin.User user, string newPassword, t validator, string loggedInUser = "") where t : BaseChangePassword     // #11201
		{
            return validator.ValidateChange(user, newPassword, loggedInUser);               // #11201
		}
	}
}