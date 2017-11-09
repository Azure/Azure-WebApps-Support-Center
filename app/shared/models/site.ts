import { ArmObj } from './armObj';

export interface Site {
    name: string;
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
}

export interface SiteRestartData {
    resourceUri: string;
    siteName: string;
}