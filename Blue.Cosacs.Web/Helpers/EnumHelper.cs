using System;
using System.Collections.Generic;
using System.Linq;

namespace Blue.Cosacs.Web.Helpers
{
    public static class EnumHelper
    {
        public class NameValue
        {
            public int Value { get; set; }
            public string Name { get; set; }
        }

        public static List<NameValue> GetValuesFromEnum(Type enumType)
        {
            var names = Enum.GetNames(enumType);
            return names.Select(n => new NameValue { Name = n, Value = (int)Enum.Parse(enumType, n) }).ToList();
        }
    }
}