﻿//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//     Runtime Version:4.0.30319.34014
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Blue.Cosacs.Web {
    using System;
    
    
    /// <summary>
    ///   A strongly-typed resource class, for looking up localized strings, etc.
    /// </summary>
    // This class was auto-generated by the StronglyTypedResourceBuilder
    // class via a tool like ResGen or Visual Studio.
    // To add or remove a member, edit your .ResX file then rerun ResGen
    // with the /str option, or rebuild your VS project.
    [global::System.CodeDom.Compiler.GeneratedCodeAttribute("System.Resources.Tools.StronglyTypedResourceBuilder", "4.0.0.0")]
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute()]
    [global::System.Runtime.CompilerServices.CompilerGeneratedAttribute()]
    internal class Resources {
        
        private static global::System.Resources.ResourceManager resourceMan;
        
        private static global::System.Globalization.CultureInfo resourceCulture;
        
        [global::System.Diagnostics.CodeAnalysis.SuppressMessageAttribute("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
        internal Resources() {
        }
        
        /// <summary>
        ///   Returns the cached ResourceManager instance used by this class.
        /// </summary>
        [global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
        internal static global::System.Resources.ResourceManager ResourceManager {
            get {
                if (object.ReferenceEquals(resourceMan, null)) {
                    global::System.Resources.ResourceManager temp = new global::System.Resources.ResourceManager("Blue.Cosacs.Web.Resources", typeof(Resources).Assembly);
                    resourceMan = temp;
                }
                return resourceMan;
            }
        }
        
        /// <summary>
        ///   Overrides the current thread's CurrentUICulture property for all
        ///   resource lookups using this strongly typed resource class.
        /// </summary>
        [global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
        internal static global::System.Globalization.CultureInfo Culture {
            get {
                return resourceCulture;
            }
            set {
                resourceCulture = value;
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Your password has expired and must be changed..
        /// </summary>
        internal static string MustChangePassword {
            get {
                return ResourceManager.GetString("MustChangePassword", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to New password and current password should not be the same..
        /// </summary>
        internal static string NewOldPasswordAreEqueal {
            get {
                return ResourceManager.GetString("NewOldPasswordAreEqueal", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to It was not possible to send the request e-mail change password. Please contact your system administrator.
        /// </summary>
        internal static string NoPossibleSendeMail {
            get {
                return ResourceManager.GetString("NoPossibleSendeMail", resourceCulture);
            }
        }
        
        /// <summary>
        ///   Looks up a localized string similar to Your password is too common. Please change..
        /// </summary>
        internal static string PasswordTooCommon {
            get {
                return ResourceManager.GetString("PasswordTooCommon", resourceCulture);
            }
        }
    }
}
