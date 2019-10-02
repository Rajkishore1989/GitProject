using System;

namespace Blue.Cosacs.Web
{
    public static class CommonExtensions
    {
        private static string DATTIME_DEFAULT_LONG_FORMAT = "f";
        private static string DATTIME_DEFAULT_SHORT_FORMAT = "g";
        private const string DEFAULT_UI_CULTURE = "en-GB";

        /// <summary>
        /// Convert a <c>System.DateTime</c> value to string to be displayed on the UI
        /// </summary>
        /// <param name="value">A <c>System.DateTime</c> to be convertted</param>
        /// <returns>
        /// By defualt it uses the "f" to convert the <paramref name="value"/> to string
        /// </returns>
        public static string DateToUILongString(this DateTime value)
        {
            return value.DateToUILongString(DATTIME_DEFAULT_LONG_FORMAT);
        }

        /// <summary>
        /// Convert a <c>System.DateTime</c> value to string to be displayed on the UI
        /// </summary>
        /// <param name="value">A <c>System.DateTime</c> to be convertted</param>
        /// <returns>
        /// <param name="defaultFormat">The default format.</param>
        public static string DateToUILongString(this DateTime value, string defaultFormat)
        {
            return value.ToString(defaultFormat, System.Globalization.CultureInfo.GetCultureInfo(DEFAULT_UI_CULTURE));
        }

        /// <summary>
        /// Convert a <c>System.DateTime</c> value to string to be displayed on the UI
        /// </summary>
        /// <param name="value">A <c>System.DateTime</c> to be convertted</param>
        /// <returns>
        /// By defualt it uses the "g" to convert the <paramref name="value"/> to string
        /// </returns>
        public static string DateToUIShortString(this DateTime value)
        {
            return value.DateToUIShortString(DATTIME_DEFAULT_SHORT_FORMAT);
        }

        /// <summary>
        /// Convert a <c>System.DateTime</c> value to string to be displayed on the UI
        /// </summary>
        /// <param name="value">A <c>System.DateTime</c> to be convertted</param>
        /// <returns>
        /// <param name="defaultFormat">The default format.</param>
        public static string DateToUIShortString(this DateTime value, string defaultFormat)
        {
            return value.ToString(defaultFormat, System.Globalization.CultureInfo.GetCultureInfo(DEFAULT_UI_CULTURE));
        }
    }
}