import { Dictionary } from "../utilities/extensions";
import { Rendering, DiagnosticData, HealthStatus } from "./detector";

export class InsightBase {
    status: HealthStatus;
    title: string;

    constructor(status: string, title: string) {
        this.title = title;
        this.status = HealthStatus[status];
    }
}

export class Insight extends InsightBase {
    
    data: Dictionary<string>;

    isExpanded: boolean = false;

    constructor(status: string, title: string, isExpanded: boolean) {
        super(status, title);
        this.data = {};
        this.isExpanded = isExpanded;
    }

    getKeys(): string[] {
        return Object.keys(this.data);
    }

    hasData(): boolean {
        return Object.keys(this.data).length > 0;
    }
}

export class DynamicInsight extends InsightBase {
    description: string;
    innerDiagnosticData: DiagnosticData;
    expanded: boolean;
}