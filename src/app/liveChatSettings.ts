// This file contains Live Chat Settings
export class LiveChatSettings {

    // If set to true, Live chat in home page will only show for demo subs
    // If set to false, it will show for all prod subs 
    public static DemoModeForHomePage: boolean = false;

    // If set to true, Live chat will show in case submission for enabled Topics for demo subs
    // If set to false, it will show for all prod subs.
    public static DemoModeForCaseSubmission: boolean = false;

    // If set to true, chat will be hidden for internal subscriptions
    public static HideForInternalSubscriptions: boolean = false;

    // List of Support Topics for which Live chat is Enabled
    public static enabledSupportTopics: string[] = [
        "32570954",     //Availability and Performance/Web App Restarted
        "32440123",     //Configuration and Management/Configuring SSL
        "32440122",     //Configuration and Management/Configuring custom domain names
        "32542210",     //Configuration and Management/IP Configuration
        "32589277"      //How Do I/Configure domains and certificates
    ];

    // This indicates the time after which Live Chat will pop up. 
    public static InactivityTimeoutInMs: Number = 10000;

    // Live Chat Business Hours
    public static BuisnessStartDay: Number = 1; // Monday
    public static BuisnessEndDay: Number = 5;   // Friday
    public static BusinessStartHourPST: Number = 7;   // 7 AM PST
    public static BusinessEndHourPST: Number = 17;     // 5 PM PST
}