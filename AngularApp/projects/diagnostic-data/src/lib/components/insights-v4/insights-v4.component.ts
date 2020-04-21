import { Component, OnDestroy, Renderer2, ViewChildren, QueryList, AfterViewInit } from "@angular/core";
import { Router } from "@angular/router";
import { MarkdownComponent } from "ngx-markdown";
import { DataRenderBaseComponent } from "../data-render-base/data-render-base.component";
import { RenderingType, InsightsRendering, HealthStatus, DiagnosticData } from "../../models/detector";
import { Insight, InsightUtils } from "../../models/insight";
import { TelemetryService } from "../../services/telemetry/telemetry.service";
import { LinkInterceptorService } from "../../services/link-interceptor.service";
import { TelemetryEventNames } from "../../services/telemetry/telemetry.common";


@Component({
  selector: 'insights-v4',
  templateUrl: './insights-v4.component.html',
  styleUrls: ['./insights-v4.component.scss']
})
export class InsightsV4Component extends DataRenderBaseComponent implements AfterViewInit, OnDestroy {
 
  @ViewChildren('markdownDiv') markdownComponents: QueryList<MarkdownComponent>;

  ngAfterViewInit() {
    if (this.markdownComponents != null && this.markdownComponents.length > 0)
    this.markdownComponents.toArray().forEach(markdownDiv => {
      this.listenObj = this.renderer.listen(markdownDiv.element.nativeElement, 'click', (evt) => this._interceptorService.interceptLinkClick(evt, this.router, this.detector, this.telemetryService));
    });
  }

  private listenObj: any;
  private markdownDiv: MarkdownComponent;

  DataRenderingType = RenderingType.Insights;

  renderingProperties: InsightsRendering;

  public insights: Insight[];

  InsightStatus = HealthStatus;

  constructor(protected telemetryService: TelemetryService, private renderer: Renderer2, private router: Router, private _interceptorService: LinkInterceptorService) {
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
    insight.isExpanded = this.hasContent(insight) && !insight.isExpanded;
    this.logInsightClickEvent(insight.title, insight.isExpanded, insight.status);
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

  ngOnDestroy(): void {
    if (this.listenObj) {
      this.listenObj();
    }
  }

}
