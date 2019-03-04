using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using SendGrid.Helpers.Mail;

namespace AppLensV3.Services.EmailNotificationService
{
    public interface IEmailNotificationService
    {
        Task SendPublishingAlert(string alias, string detectorId, string link, List<EmailAddress> tos);
    }
}