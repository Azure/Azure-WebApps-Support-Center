export interface Category {
    id: string;
    name: string;
    description: string;
    keywords: string[];
    color: string;
    createFlowForCategory: boolean;
    overridePath?: string;
}