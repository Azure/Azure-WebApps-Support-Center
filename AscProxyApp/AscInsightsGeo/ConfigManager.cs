using System;
using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics;
using System.Linq;
using System.Web;

namespace AscInsightsGeo
{
    public static class ConfigManager
    {
        public static string Get(string configKey)
        {
            var value = Environment.GetEnvironmentVariable(configKey) ?? ConfigurationManager.AppSettings.Get(configKey);
            return value;
        }
    }
}