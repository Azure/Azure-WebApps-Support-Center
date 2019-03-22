import { MarkdownService } from 'ngx-markdown';
import { Component } from '@angular/core';
import { DiagnosticData, DynamicInsightRendering, HealthStatus } from '../../models/detector';
import { DynamicInsight } from '../../models/insight';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';

@Component({
  selector: 'dynamic-insight',
  templateUrl: './dynamic-insight.component.html',
  styleUrls: ['./dynamic-insight.component.scss', '../insights/insights.component.scss']
})
export class DynamicInsightComponent extends DataRenderBaseComponent {

  renderingProperties: DynamicInsightRendering;

  insight: DynamicInsight;

  InsightStatus = HealthStatus;

  constructor(private _markdownService: MarkdownService, protected telemetryService: TelemetryService) {
    super(telemetryService);
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <DynamicInsightRendering>data.renderingProperties;

    this.parseInsight();
  }

  private parseInsight() {

    // Make sure that we don't render a box within the insight
    this.renderingProperties.innerRendering.title = '';

    this.insight = <DynamicInsight> {
      title: this.renderingProperties.title,
      description: this._markdownService.compile(this.renderingProperties.description),
      status: this.renderingProperties.status,
      expanded: this.renderingProperties.expanded !== undefined && this.renderingProperties.expanded !== null? this.renderingProperties.expanded : true,
      innerDiagnosticData: <DiagnosticData>{
        renderingProperties: this.renderingProperties.innerRendering,
        table: this.diagnosticData.table
      }
    };
  }
}
