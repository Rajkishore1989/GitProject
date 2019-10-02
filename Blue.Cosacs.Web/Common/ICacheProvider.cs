namespace Blue.Cosacs.Web.Common
{
    public interface ICacheProvider
    {
        object Get(string key);

        T Get<T>(string key) where T : class;

        object Insert(string key, object item);

        string Insert(object keyObj, object value);
    }
}
