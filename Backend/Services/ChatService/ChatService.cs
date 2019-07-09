using System;
using System.Linq;
using Backend.Models;
using Microsoft.Extensions.Configuration;
using NodaTime;

namespace Backend.Services
{
    public class ChatService : IChatService
    {
        private ChatConfiguration chatConfig;
        private IConfiguration overallConfig;

        public ChatService(ChatConfiguration chatConfig, IConfiguration configuration)
        {
            this.chatConfig = chatConfig;
            this.overallConfig = configuration;
        }

        public ChatStatus GetChatStatus(string product, string supportTopic)
        {
            var currentDateTime = new ZonedDateTime(SystemClock.Instance.GetCurrentInstant(), DateTimeZoneProviders.Tzdb["America/Los_Angeles"]);

            ProductSpecificSettings productSettings = null;
            ChatHoursDuration[] chatHours = null;
            if (!string.IsNullOrWhiteSpace(product))
            {
                productSettings = chatConfig.ProductSpecificSettings.FirstOrDefault(p => p.Name.Equals(product, StringComparison.OrdinalIgnoreCase));
                if (productSettings != null)
                {
                    chatHours = productSettings.ChatHours;
                }
                
            }

            return new ChatStatus
            {
                FreshToken = overallConfig["Chat:FreshToken"],
                IsEnabled = chatConfig.GlobalEnabled,
                IsValidTime = IsWorkingHour(currentDateTime, productSettings, supportTopic) && !IsBreakTime(currentDateTime, chatHours) && !IsHoliday(currentDateTime, chatHours)
            };
        }

        private bool IsHoliday(ZonedDateTime currentDateTime, ChatHoursDuration[] chatHours)
        {
            if (chatHours == null || !chatHours.Any())
            {
                return false;
            }
            foreach (var duration in chatHours)
            {
                if (IsTimeWithinDuration(currentDateTime, duration))
                {
                    if (duration.PublicHolidaysRegion != null)
                    {
                        var publicHolidays = chatConfig.PublicHolidayRegions.Where(x => x.Name == duration.PublicHolidaysRegion).FirstOrDefault();
                        if (publicHolidays != null && publicHolidays.Holidays != null && publicHolidays.Holidays.Any())
                        {
                            foreach (var holiday in publicHolidays.Holidays)
                            {
                                if (currentDateTime.Day == holiday.Day && currentDateTime.Month == holiday.Month && currentDateTime.Year == holiday.Year)
                                {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }

            return false;
        }

        private bool IsWorkingHour(ZonedDateTime currentDateTime, ProductSpecificSettings productSettings, string supportTopic)
        {
            ChatHoursDuration[] chatDuration = chatConfig.GlobalChatHours;
            if(productSettings != null && productSettings.ChatHours != null && productSettings.ChatHours.Any())
            {
                chatDuration = productSettings.ChatHours;
            }

            bool result = false;
            foreach(var duration in chatDuration)
            {
                result = result || IsTimeWithinDuration(currentDateTime, duration, supportTopic);
            }

            return result;
        }

        private bool IsTimeWithinDuration(ZonedDateTime currentDateTime, ChatHoursDuration timeDuration, string supportTopic  = "")
        {
            var dayOfWeek = (int)currentDateTime.DayOfWeek % 7;
            DateTime startTime = DateTime.ParseExact(timeDuration.BusinessStartTimePST, "HH:mm", null);
            DateTime endTime = DateTime.ParseExact(timeDuration.BusinessEndTimePST, "HH:mm", null);

            bool supportTopicMatches = (supportTopic != "" && timeDuration.SupportTopics.Any()) ? timeDuration.SupportTopics.Contains(supportTopic) : true;
            
            return (dayOfWeek >= timeDuration.BusinessStartDay && dayOfWeek <= timeDuration.BuisnessEndDay)
                    && (currentDateTime.Hour > startTime.Hour || (currentDateTime.Hour == startTime.Hour && currentDateTime.Minute >= startTime.Minute))
                    && (currentDateTime.Hour < endTime.Hour || (currentDateTime.Hour == endTime.Hour && currentDateTime.Minute <= endTime.Minute))
                    && supportTopicMatches;
        }

        private bool IsBreakTime(ZonedDateTime currentDateTime, ChatHoursDuration[] chatHours)
        {
            if (chatHours == null || !chatHours.Any())
            {
                return false;
            }

            var dayOfWeek = (int)currentDateTime.DayOfWeek;
            foreach (var duration in chatHours)
            {
                if (IsTimeWithinDuration(currentDateTime, duration))
                {
                    if (duration.OffHoursRegion != null)
                    {
                        var offHours = chatConfig.OffHoursRegions.Where(x => x.Name == duration.OffHoursRegion).FirstOrDefault();
                        if (offHours != null && offHours.Hours != null && offHours.Hours.Any())
                        {
                            foreach (var breakTime in offHours.Hours)
                            {
                                DateTime startTime = DateTime.ParseExact(breakTime.StartTimePST, "HH:mm", null);
                                DateTime endTime = DateTime.ParseExact(breakTime.EndTimePST, "HH:mm", null);

                                if (dayOfWeek == breakTime.Day &&
                                   (currentDateTime.Hour > startTime.Hour || (currentDateTime.Hour == startTime.Hour && currentDateTime.Minute > startTime.Minute)) &&
                                   (currentDateTime.Hour < endTime.Hour || (currentDateTime.Hour == endTime.Hour && currentDateTime.Minute < endTime.Hour)))
                                {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }

            return false;
        }
    }
}
