

export class SiteInfoMetaData {
    subscriptionId: string;
    resourceGroupName: string;
    siteName: string;
}

export class AdvancedApplicationRestartInfo extends SiteInfoMetaData {
    instances: InstanceInfo[];
}

export class SiteProfilingInfo extends SiteInfoMetaData {
    instances: string[];
}

export class InstanceInfo {
    machineName: string;
    instanceId: string;
}