import {ArmObj} from './armObj';

export interface ServerFarm extends ArmObj {
    properties: {
        name: string;
        sku: string;
        workerSize: WorkerSize;
        numberOfWorkers: number;
        numberOfSites: number;
    }
    sku: {
        name: string;
        tier: string;
        family: string;
        capacity: number;
    }
    additionalProperties: {
        cores: number;
        ramInGB: number;
    }
}

export enum Sku {
    Free = 1 << 0,
    Shared = 1 << 1,
    Basic = 1 << 2,
    Standard = 1 << 3,
    Premium = 1 << 4,
    Dynamic = 1 << 5,
    Paid = 25,
    NotDynamic = 31, // 011111
    All = 255 // 11111111
}

export enum WorkerSize {
    small = 0,
    medium = 1,
    large = 2
}