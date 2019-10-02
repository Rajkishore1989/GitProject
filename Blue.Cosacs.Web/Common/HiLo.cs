using System;
using System.Collections.Generic;

namespace Blue.Cosacs.Web.Common
{
    /// <summary>
    /// This class is thread safe so an instance can be shared by multiple web requests.
    /// </summary>
    public class HiLo
    {
        /// <summary>
        /// Do not use this constructor directly unless you really know what you are doing. Talk to Miguel.
        /// You probably want to use the HiLo.Cache static method.
        /// </summary>
        public HiLo(string sequence)
        {
            this.sequence = SequenceValidate(sequence);
        }

        private int currentHi, currentLo, maxLo;
        private readonly string sequence;

        public string Sequence
        {
            get { return sequence; }
        }

        public static class Impl
        {
            public static void Allocate(string sequence, out int currentHi, out int maxLo)
            {
                using (var scope = External.Context.Write())
                {
                    var cmd = new External.HiLoAllocate { Sequence = sequence };
                    cmd.ExecuteNonQuery();
                    currentHi = cmd.CurrentHi.Value;
                    maxLo = cmd.MaxLo.Value;
                    scope.Complete();
                }
            }

            public static void SetMaxLo(string sequence, int maxLo)
            {
                //Context.Database().ExecuteNonQuery("UPDATE HiLo SET MaxLo = {0} WHERE Sequence = {1}", maxLo, sequence);
                using (var scope = External.Context.Write())
                {
                    scope.Context.Database.ExecuteSqlCommand("UPDATE HiLo SET MaxLo = {0} WHERE Sequence = {1}", maxLo, sequence);
                    scope.Complete();
                }
            }
        }

        public int NextId()
        {
            lock (this)
            {
                currentLo++;
                if (currentHi + currentLo >= currentHi + maxLo)
                {
                    Impl.Allocate(sequence, out currentHi, out maxLo);
                    currentLo = 0;
                }
                return currentHi + currentLo;
            }
        }

        private static string SequenceValidate(string sequence)
        {
            if (string.IsNullOrWhiteSpace(sequence))
                throw new ArgumentNullException("sequence");
            return sequence.ToLower();
        }

        /// <summary>
        /// Sequence name is not case sensitive. Returns a HiLo object for that sequence reusing the 
        /// object across multiple requests and threads.
        /// </summary>
        public static HiLo Cache(string sequence)
        {
            sequence = SequenceValidate(sequence);

            lock (cache)
            {
                if (!cache.ContainsKey(sequence))
                    return cache[sequence] = new HiLo(sequence);

                return cache[sequence];
            }
        }

        private static readonly IDictionary<string, HiLo> cache = new Dictionary<string, HiLo>();
    }
}
