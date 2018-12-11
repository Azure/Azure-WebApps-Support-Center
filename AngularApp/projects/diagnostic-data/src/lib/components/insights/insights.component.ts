import { Component, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { Rendering, RenderingType, DiagnosticData, InsightsRendering, HealthStatus } from '../../models/detector';
import { Dictionary } from '../../utilities/extensions';
import { Insight } from '../../models/insight';
import { DiagnosticService } from '../../services/diagnostic.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';

@Component({
  selector: 'insights',
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss']
})
export class InsightsComponent extends DataRenderBaseComponent {

  DataRenderingType = RenderingType.Insights;

  renderingProperties: InsightsRendering;

  public insights: Insight[];

  InsightStatus = HealthStatus;

  constructor(protected telemetryService: TelemetryService) {
    super(telemetryService);
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <InsightsRendering>data.renderingProperties;

    this.parseInsights();
  }

  private parseInsights() {
    let insights: Insight[] = [];
    let data = this.diagnosticData.table;

    let statusColumnIndex = 0;
    let insightColumnIndex = 1;
    let nameColumnIndex = 2;
    let valueColumnIndex = 3;
    let isExpandedIndex = 4;

    for (let i: number = 0; i < data.rows.length; i++) {
      let row = data.rows[i];
      let insight: Insight;
      let insightName = row[insightColumnIndex];
      if ((insight = insights.find(insight => insight.title === insightName)) == null) {
        let isExpanded: boolean = row.length > isExpandedIndex ? row[isExpandedIndex].toLowerCase() === 'true' : false
        insight = new Insight(row[statusColumnIndex], insightName, isExpanded);
        insights.push(insight);
      }

      let nameColumnValue = row[nameColumnIndex];
      if (nameColumnValue && nameColumnValue.length > 0) {
        insight.data[nameColumnValue] = row[valueColumnIndex];
      }
    }

    this.insights = insights;
  }

  isMarkdown(str: string) {
    return str.trim().startsWith('<markdown>') && str.endsWith('</markdown>');
  }

  getMarkdown(str: string) {
    return str.trim().replace('<markdown>', '').replace('</markdown>', '');
  }

  toggleInsightStatus(insight: any) {
    insight.isExpanded = insight.hasData() && !insight.isExpanded;
    this.logInsightClickEvent(insight.title, insight.isExpanded, insight.status);
  }

  logInsightClickEvent(insightName: string, isExpanded: boolean, status: string) {
    let eventProps: { [name: string]: string } = {
      "Title": insightName,
      "IsExpanded": String(isExpanded),
      "Status": status
    };

    this.logEvent(TelemetryEventNames.InsightsTitleClicked, eventProps);
  }
}

