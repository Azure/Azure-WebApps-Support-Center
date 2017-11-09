

export class SiteInfoMetaData {
    subscriptionId: string;
    resourceGroupName: string;
    siteName: string;
}

export class AdvancedApplicationRestartInfo extends SiteInfoMetaData {
    instances: InstanceInfo[];
}

export class SiteProfilingInfo extends SiteInfoMetaData {
    slot:string;
    instances: string[];
}

export class InstanceInfo {
    machineName: string;
    instanceId: string;
}