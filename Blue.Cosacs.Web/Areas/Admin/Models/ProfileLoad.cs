using System.Collections.Generic;
using Blue.Admin;

namespace Blue.Cosacs.Web.Areas.Admin.Models
{
    public class ProfileLoad
    {
        public Profile Profile { get; set; }
        public IEnumerable<Blue.Events.IEvent> Audit { get; set; }

        public int PasswordExpireDays
        {
            get
            {
                return PasswordComplexityParameters.Current.PasswordExpireInDays;
            }
        }


        LockUser lockUserParameters;
        public LockUser LockUserParameters
        {
            get
            {
                if (lockUserParameters == null)
                {
                    this.lockUserParameters = new LockUser()
                    {
                        IsLocked = Profile.Locked
                    };
                }

                return this.lockUserParameters;
            }
            set
            {
                this.lockUserParameters = value;
            }
        }
        public List<UserProfile> AdditionalProfiles;


        public class UserProfile
        {
            public string ProfileName { get; set; }
            public int id { get; set; }
            public bool HasPermission { get; set; }
            public int Permission { get; set; }
            public string Module { get; set; }
            public bool Active { get; set; }
        }

    }
}