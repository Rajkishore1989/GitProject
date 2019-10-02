using System.Data.Entity;
using Blue.Transactions;
using System.Reflection;
using System.Collections.Generic;
using System;
using System.Linq;

namespace Blue.Cosacs.Web.Common.External
{
    public abstract partial class ContextBase : DbContextBase
    {
        public const string ConnectionStringName = "Default";

        protected ContextBase()
            : base(ConnectionStringName)
        {
            Database.SetInitializer<Context>(null);
        }
    }

    public partial class Context : ContextBase
    {
        public static ReadScope<Context> Read()
        {
            return new ReadScope<Context>();
        }

        public static WriteScope<Context> Write()
        {
            return new WriteScope<Context>();
        }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<ViewSets>().HasKey(t => new
            {
                t.tname,
                t.setname
            });
        }
    }
}
