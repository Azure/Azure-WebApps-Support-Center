// This file contains Live Chat Settings
export class LiveChatSettings {

    // Global Switch that controls whether chat is shown or not.
    // If False, it will override, every other setting
    public static GLOBAL_ON_SWITCH: boolean = true;

    // If set to true, Live chat in home page will only show for demo subs
    // If set to false, it will show for all prod subs
    public static DemoModeForHomePage: boolean = true;

    // If set to true, Live chat will show in case submission for enabled Topics for demo subs
    // If set to false, it will show for all prod subs.
    public static DemoModeForCaseSubmission: boolean = false;

    // If set to true, chat will be hidden for internal subscriptions
    public static HideForInternalSubscriptions: boolean = false;

    // This indicates the time after which Live Chat will pop up.
    public static InactivityTimeoutInMs: number = 5000;
}

export class ChatStatus {
    public isEnabled: boolean;
    public isValidTime: boolean;
    public freshToken: string;
}
