using System.Web.Mvc;
using System;

public class DecimalModelBinder : DefaultModelBinder
{
    #region Implementation of IModelBinder

    public override object BindModel(ControllerContext controllerContext, ModelBindingContext bindingContext)
    {
        var valueProviderResult = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);

        if (valueProviderResult.AttemptedValue.Equals("N.aN") ||
            valueProviderResult.AttemptedValue.Equals("NaN") ||
            valueProviderResult.AttemptedValue.Equals("Infini.ty") ||
            valueProviderResult.AttemptedValue.Equals("Infinity") ||
            string.IsNullOrEmpty(valueProviderResult.AttemptedValue))
            return 0m;

        return valueProviderResult == null ? base.BindModel(controllerContext, bindingContext) : Convert.ToDecimal(valueProviderResult.AttemptedValue);
    }

    #endregion
}

public class NullableDecimalModelBinder : DefaultModelBinder
{
    #region Implementation of IModelBinder

    public override object BindModel(ControllerContext controllerContext, ModelBindingContext bindingContext)
    {
        var valueProviderResult = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);

        if (valueProviderResult.AttemptedValue.Equals("N.aN") ||
            valueProviderResult.AttemptedValue.Equals("NaN") ||
            valueProviderResult.AttemptedValue.Equals("Infini.ty") ||
            valueProviderResult.AttemptedValue.Equals("Infinity") ||
            string.IsNullOrEmpty(valueProviderResult.AttemptedValue) ||
            valueProviderResult.AttemptedValue.Equals("null"))
            return null;

        return valueProviderResult == null ? base.BindModel(controllerContext, bindingContext) : Convert.ToDecimal(valueProviderResult.AttemptedValue);
    }

    #endregion
}