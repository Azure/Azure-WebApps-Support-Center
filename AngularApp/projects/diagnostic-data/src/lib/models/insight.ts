import { Rendering, DiagnosticData, HealthStatus, RenderingType, DetectorResponse } from './detector';

export class InsightBase {
    status: HealthStatus;
    title: string;

    constructor(status: string, title: string) {
        this.title = title;
        this.status = HealthStatus[status];
    }
}

export class Insight extends InsightBase {

    data: Map<string, string>;

    isExpanded: boolean = false;

    isRated: boolean = false;

    isHelpful: boolean = false;

    constructor(status: string, title: string, isExpanded: boolean) {
        super(status, title);
        this.data = new Map<string, string>();
        this.isExpanded = isExpanded;
        this.isRated = this.isRated;
        this.isHelpful = this.isHelpful;
    }

    getKeys(): string[] {
        return Object.keys(this.data);
    }

    hasData(): boolean {
        return Object.keys(this.data).length > 0;
    }
}

export class InsightUtils {
    static parseAllInsightsFromResponse(response: DetectorResponse): Insight[] {
        let insightDiagnosticData = response.dataset.filter(data => (<Rendering>data.renderingProperties).type === RenderingType.Insights);

        let allInsights: Insight[] = [];

        insightDiagnosticData.forEach((diagnosticData: DiagnosticData) => {
            let insights = this.parseInsightRendering(diagnosticData);
            insights.forEach(insight => allInsights.push(insight));
        });

        return allInsights;
    }

    static parseInsightRendering(diagnosticData: DiagnosticData): Insight[] {
        const insights: Insight[] = [];
        const data = diagnosticData.table;
    
        const statusColumnIndex = 0;
        const insightColumnIndex = 1;
        const nameColumnIndex = 2;
        const valueColumnIndex = 3;
        const isExpandedIndex = 4;
    
        for (let i: number = 0; i < data.rows.length; i++) {
          const row = data.rows[i];
          let insight: Insight;
          const insightName = row[insightColumnIndex];
          if ((insight = insights.find(ins => ins.title === insightName)) == null) {
            const isExpanded: boolean = row.length > isExpandedIndex ? row[isExpandedIndex].toLowerCase() === 'true' : false;
            insight = new Insight(row[statusColumnIndex], insightName, isExpanded);
            insights.push(insight);
          }
    
          const nameColumnValue = row[nameColumnIndex];
          if (nameColumnValue && nameColumnValue.length > 0) {
            insight.data[nameColumnValue] = row[valueColumnIndex];
          }
        }
    
        return insights;
      }
}

export class DynamicInsight extends InsightBase {
    description: string;
    innerDiagnosticData: DiagnosticData;
    expanded: boolean;
}
