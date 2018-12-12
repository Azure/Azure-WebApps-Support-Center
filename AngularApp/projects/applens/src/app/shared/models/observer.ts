export interface ObserverSiteResponse {
    siteName: string;
    details: ObserverSiteInfo[];
    hostNames: string[];
}

export interface ObserverSiteInfo {
    SiteName: string;
    StampName: string;
    InternalStampName: string;
    Subscription: string;
    WebSpace: string;
    ResourceGroupName: string;
    SlotName: string;
    Hostnames: string[];
}

export interface ObserverAseResponse {
    details: ObserverAseInfo;
}

export interface ObserverAseInfo {
    ID: number;
    Name: string;
    LocationId: number;
    PublicHost: string;
    VNETName: string;
    VNETId: string;
    VNETSubnetName: string;
    WebWorkerSize: string;
    WebWorkerRoleCount: number;
    MultiSize: string;
    MultiRoleCount: number;
    IPSSLAddressCount: number;
    MonitoringDataAccountId: number;
    SmallDedicatedWebWorkerSize: string;
    SmallDedicatedWebWorkerRoleCount: number;
    MediumDedicatedWebWorkerSize: string;
    MediumDedicatedWebWorkerRoleCount: number;
    LargeDedicatedWebWorkerSize: string;
    LargeDedicatedWebWorkerRoleCount: number;
    Allocated: boolean;
    DatabaseEdition: string;
    DatabaseServiceObjective: string;
    MaximumNumberOfMachines: number;
    UpgradeDomains: number;
    VNETSubnetAddressRange: string;
    DeploymentOrder: number;
    AllowedMultiSizes?: null;
    AllowedWorkerSizes?: null;
    DefinitionsPath?: null;
    SettingsPath?: null;
    UserServiceEndpoint: string;
    CustomerSubscriptionId: string;
    VNETResourceGroup: string;
    DeletedOn?: null;
    DatabaseServerVersion: string;
    Suspended: boolean;
    ManualResumeOnly: boolean;
    ExtraDefinitions: string;
    InternalLoadBalancingMode: number;
    ApiHubEnabled: boolean;
    VNETSubscriptionId: string;
    CustomBuild: boolean;
    ClusterSettings?: null;
    DnsSuffix?: null;
    VNETResourceType: string;
    DynamicCacheEnabled: boolean;
    FileServerRoleCount: number;
    EnvironmentType: number;
    InternalStampName: string;
    Subscription: string;
    ResourceGroupName: string;
}
