using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Models
{
    public class SupportTopic
    {
        public string ProductId { get; set; }

        public string SupportTopicId { get; set; }

        public string ProductName { get; set; }


        public string SupportTopicL2Name { get; set; }

        public string SupportTopicL3Name { get; set; }

        public string SupportTopicPath { get; set; }

        //public SupportTopic(string productId, string supportTopicId, string productName, string supportTopicL2Name, string supportTopicL3Name, string supportTopicPath)
        //{
        //    ProductId = productId;
        //    SupportTopicId = supportTopicId;
        //    ProductName = productName;
        //    SupportTopicL2Name = supportTopicL2Name;
        //    SupportTopicL3Name = supportTopicL3Name;
        //    SupportTopicPath = supportTopicPath;
        //}
    }
}
