using System;


namespace Backend.Models
{
    public class Permission
    {
        public Value[] value { get; set; }
    }

    public class Value
    {
        public string[] actions { get; set; }
        public object[] notActions { get; set; }
    }
}
