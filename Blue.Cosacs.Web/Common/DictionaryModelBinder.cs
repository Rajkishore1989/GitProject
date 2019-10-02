namespace Blue.Cosacs.Web.Common
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Reflection;
    using System.Web.Mvc;

    public class DictionaryModelBinder<TKey, TValue> : IModelBinder where TKey : IConvertible where TValue : IConvertible
    {
        /// <summary>
        /// Binds the model to a value by using the specified controller context and binding context.
        /// </summary>
        /// <returns>
        /// The bound value.
        /// </returns>
        /// <param name="controllerContext">The controller context.</param><param name="bindingContext">The binding context.</param>
        public object BindModel(ControllerContext controllerContext, ModelBindingContext bindingContext)
        {
            if (bindingContext == null)
            {
                throw new ArgumentNullException("bindingContext");
            }

            string modelName = bindingContext.ModelName.ToLower();
            // Create a dictionary to hold the results
            IDictionary<TKey, TValue> result = new Dictionary<TKey, TValue>();

            // The ValueProvider property is of type IValueProvider, but it typically holds an object of type ValueProviderCollect
            // which is a collection of all the registered value providers.
            var providers = bindingContext.ValueProvider as ValueProviderCollection;
            if (providers != null)
            {
                // The DictionaryValueProvider is the once which contains the json values; unfortunately the ChildActionValueProvider and
                // RouteDataValueProvider extend DictionaryValueProvider too, so we have to get the provider which contains the 
                // modelName as a key. 
                var dictionaryValueProvider = providers
                    .OfType<DictionaryValueProvider<object>>()
                    .FirstOrDefault(vp => vp.ContainsPrefix(modelName));
                if (dictionaryValueProvider != null)
                {
                    // There's no public property for getting the collection of keys in a value provider. There is however
                    // a private field we can access with a bit of reflection.
                    var valuesFieldInfo = dictionaryValueProvider.GetType().GetField("_values", BindingFlags.Instance | BindingFlags.NonPublic);
                    if (valuesFieldInfo != null)
                    {
                        var values = valuesFieldInfo.GetValue(dictionaryValueProvider) as Dictionary<string, ValueProviderResult>;
                        if (values != null)
                        {
                            // Find all the keys which start with the model name. If the model name is model.DictionaryProperty; 
                            // the keys we're looking for are model.DictionaryProperty.KeyName.
                            var dictionaryItems = values.Where(p => p.Key.ToLower().StartsWith(modelName + "."));
                            foreach (var item in dictionaryItems)
                            {
                                // With each key, we can extract the value from the value provider. When adding to the dictionary we want to strip
                                // out the modelName prefix. (+1 for the extra '.')
                                result.Add((TKey)Convert.ChangeType(item.Key.Substring(modelName.Length + 1), typeof(TKey)), (TValue)Convert.ChangeType(item.Value.AttemptedValue, typeof(TValue)));
                            }
                            return result;
                        }
                    }
                }
            }
            return null;
        }
    }
}