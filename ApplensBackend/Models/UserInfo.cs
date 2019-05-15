using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


namespace AppLensV3.Models
{
    public class AuthorInfo
    {
        public AuthorInfo(string businessPhones, string displayName, string givenName, string jobTitle, string mail, string officeLocation, string userPrincipalName)
        {
            BusinessPhones = businessPhones;
            DisplayName = displayName;
            GivenName = givenName;
            JobTitle = jobTitle;
            Mail = mail;
            OfficeLocation = officeLocation;
            UserPrincipalName = userPrincipalName;
        }

        public string BusinessPhones { get; }
        public string DisplayName { get; }
        public string GivenName { get; }
        public string JobTitle { get; }
        public string Mail { get; }
        public string OfficeLocation { get; }
        public string UserPrincipalName { get; }
    }
}
