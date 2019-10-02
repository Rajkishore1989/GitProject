using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Admin.Models
{
	public class LockUser
	{
		public bool IsLocked
		{
			get;
			set;
		}

		private int? userId;
		public int UserId
		{
			get
			{
				if (!this.userId.HasValue)
				{
					userId = HttpContext.Current.GetUser().Id;
				}

				return this.userId.Value;
			}
			set
			{
				this.userId = value;
			}
		}
	}
}