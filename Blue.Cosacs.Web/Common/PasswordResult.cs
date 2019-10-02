using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Blue.Admin.Password;

namespace Blue.Cosacs.Web.Common
{
    public static class PasswordResultText
    {
        public static string GetMessage(ChangePasswordResult result)
        {
            switch (result)
            {
                case ChangePasswordResult.EqualsOld:
                    return Resources.NewOldPasswordAreEqueal;
                case ChangePasswordResult.MustChange:
                    return Resources.MustChangePassword;
                case ChangePasswordResult.TooCommon:
                    return Resources.PasswordTooCommon;
                default:
                    return "";

            }
        }
    }
}