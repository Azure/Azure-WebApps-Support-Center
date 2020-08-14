export interface Category {
    id: string;
    name: string;
    overviewDetectorId: string;
    description: string;
    keywords: string[];
    color: string;
    createFlowForCategory: boolean;
    overridePath?: string;
    chatEnabled: boolean;
}
