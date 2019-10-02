using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Blue.Cosacs.Web.Areas.Credit.Models
{
    public class ImportResult
    {
        public ImportResult()
        {
            this.Errors = new List<string>();
        }

        public bool Succeed { get; set; }
        public List<string> Errors { get; set; }
    }
}