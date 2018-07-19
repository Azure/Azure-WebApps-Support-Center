export enum AutoHealActionType {
    Recycle = 0,
    LogEvent = 1,
    CustomAction = 2
}

export class Features {
    AutoHealEnabled: boolean;
}

export class AutoHealSettings {
    autoHealEnabled: boolean;
    autoHealRules: AutoHealRules;
}

export class AutoHealRules {
    triggers: AutoHealTriggers;
    actions: AutoHealActions;
}

export class AutoHealTriggers {
    requests: RequestsBasedTrigger;
    privateBytesInKB: number;
    statusCodes: StatusCodesBasedTrigger[];
    slowRequests: SlowRequestsBasedTrigger;

}

export class RequestsBasedTrigger {
    count: number;
    timeInterval: string;
}

export class StatusCodesBasedTrigger extends RequestsBasedTrigger {

    status: number;
    subStatus: number;
    win32Status: number;
}

export class SlowRequestsBasedTrigger extends RequestsBasedTrigger {
    timeTaken: string;
}

export class AutoHealActions {
    actionType: AutoHealActionType;
    customAction: AutoHealCustomAction;
    minProcessExecutionTime: string;

}

export class AutoHealCustomAction {
    exe: string;
    parameters: string;
}
