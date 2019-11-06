export class StorageAccount {
    id: string;
    kind: string;
    location: string;
    name: string;
    type: string;
}

export interface StorageKey {
    keyName: string;
    value: string;
    permissions: string;
}

export interface StorageKeys {
    keys: StorageKey[];
}

export class NewStorageAccount {
    sku: StorageAccountSku = new StorageAccountSku();
    kind: string = "StorageV2";
    location: string;
}

export class StorageAccountSku {
    name: string = "Standard_GRS";
}
