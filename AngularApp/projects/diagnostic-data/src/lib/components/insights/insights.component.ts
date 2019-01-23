import { Component, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { Rendering, RenderingType, DiagnosticData, InsightsRendering, HealthStatus } from '../../models/detector';
import { Insight, InsightUtils } from '../../models/insight';
import { DiagnosticService } from '../../services/diagnostic.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';

@Component({
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

    this.insights = InsightUtils.parseInsightRendering(data);
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
    const eventProps: { [name: string]: string } = {
      'Title': insightName,
      'IsExpanded': String(isExpanded),
      'Status': status
    };

    this.logEvent(TelemetryEventNames.InsightTitleClicked, eventProps);
  }

  setInsightComment(insight: any, isHelpful: boolean) {
    if (!insight.isRated) {
      const eventProps: { [name: string]: string } = {
        'Title': insight.title,
        'IsHelpful': String(isHelpful)
      }
      insight.isRated = true;
      insight.isHelpful = isHelpful;
      this.logEvent(TelemetryEventNames.InsightRated, eventProps);
    }
  }
}

