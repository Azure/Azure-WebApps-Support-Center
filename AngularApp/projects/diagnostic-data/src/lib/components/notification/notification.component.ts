import { Component} from "@angular/core";
import { DataRenderBaseComponent } from "../data-render-base/data-render-base.component";
import { RenderingType, InsightsRendering, HealthStatus, DiagnosticData } from "../../models/detector";
import { Insight, InsightUtils } from "../../models/insight";
import { TelemetryService } from "../../services/telemetry/telemetry.service";
import { TelemetryEventNames } from "../../services/telemetry/telemetry.common";

@Component({
  selector: 'notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent extends DataRenderBaseComponent {
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
    toggleInsightStatus(insight: any) {
      insight.isExpanded = this.hasContent(insight) && !insight.isExpanded;
      console.log("toggle insight to expand:, and has data", insight.isExpanded, insight.hasData());
      this.logInsightClickEvent(insight.title, insight.isExpanded, insight.status);
    }

  getInsightExpandStatus(insight: any) {
      return insight.isExpanded;
  }
    hasContent(insight: Insight) {
      return insight.hasData() || this.hasSolutions(insight);
    }

    hasSolutions(insight: Insight) {
      return insight.solutions != null && insight.solutions.length > 0;
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
