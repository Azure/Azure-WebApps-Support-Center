import { ArmObj } from './armObj';
import { AppType } from './portal';

export interface Site {
    id: string;
    name: string;
    kind: string;
    tags: any;
    state: string;
    hostNames: string[];
    enabledHostNames: string[];
    hostNameSslStates: [{
        name: string;
        hostType: number;
    }];
    sku: string;
    containerSize: number;
    serverFarm: string;
    serverFarmId: string;
    hostingEnvironmentId: string;
    resourceGroup: string;
    appType: AppType;
    location: string;
}

export class SiteInfoMetaData {
    resourceUri: string;
    subscriptionId: string;
    resourceGroupName: string;
    siteName: string;
    slot: string;
}

export class SiteExtensions {
    public static operatingSystem(site: Site): OperatingSystem {
        if (site && site.kind) {
            return site.kind.split(',').indexOf('linux') > 0 ? OperatingSystem.linux : OperatingSystem.windows;
        }
        return OperatingSystem.linux | OperatingSystem.windows;
    }
}

export interface SiteRestartData {
    resourceUri: string;
    siteName: string;
}

// Flags
export enum OperatingSystem {
    windows = 1 << 0,
    linux = 1 << 1,
    any = 11 << 0
}

export enum HostingEnvironmentKind {
    None = 1 << 0,
    Public = 1 << 1,
    ILB = 1 << 2,
    NotILB = 251, // 11111011
    All = 255 // 11111111
}
