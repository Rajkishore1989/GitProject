namespace Blue.Cosacs.Web.Common
{
    using System;
    using System.Globalization;
    using System.Web;
    using System.Web.Caching;

    public class CacheProvider : ICacheProvider
    {
        public object Get(string key)
        {
            return HttpContext.Current != null ? HttpContext.Current.Cache[key] : null;
        }

        public T Get<T>(string key) where T : class
        {
            if (HttpContext.Current != null)
            {
                return HttpContext.Current.Cache[key] as T;
            }
            return null;
        }

        public object Insert(string key, object value)
        {
            return HttpContext.Current.Cache[key] = value;
        }

        public string Insert(object keyObj, object value)
        {
            return Insert(keyObj, value, new TimeSpan(1, 0, 0, 0));
        }

        public string Insert(object keyObj, object value, TimeSpan expiry)
        {
            var key = keyObj.GetHashCode().ToString(CultureInfo.InvariantCulture);
            HttpContext.Current.Cache.Add(
                key, 
                value, 
                null,
                Cache.NoAbsoluteExpiration, 
                expiry, 
                CacheItemPriority.Default, 
                null);
            return key;
        }
    }
}
