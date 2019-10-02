using System;

namespace Blue.Glaucous.Client
{
    [AttributeUsage(AttributeTargets.Method)]
    public class PublicAttribute : Attribute //FilterAttribute, IAuthorizationFilter
    {
    }
}