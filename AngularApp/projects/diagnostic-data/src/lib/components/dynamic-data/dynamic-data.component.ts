import { Moment } from 'moment';
import { BehaviorSubject } from 'rxjs';
import {
  Component, ComponentFactoryResolver, Input, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { DiagnosticData, Rendering, RenderingType } from '../../models/detector';
import { CardSelectionComponent } from '../card-selection/card-selection.component';
import { AppInsightsMarkdownComponent } from '../app-insights-markdown/app-insights-markdown.component';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DataSummaryComponent } from '../data-summary/data-summary.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DetectorListComponent } from '../detector-list/detector-list.component';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { DynamicInsightComponent } from '../dynamic-insight/dynamic-insight.component';
import { EmailComponent } from '../email/email.component';
import { InsightsComponent } from '../insights/insights.component';
import { MarkdownViewComponent } from '../markdown-view/markdown-view.component';
import { SolutionComponent } from '../solution/solution.component';
import { GuageControlComponent } from '../guage-control/guage-control.component';
import { TimeSeriesGraphComponent } from '../time-series-graph/time-series-graph.component';
import {
  TimeSeriesInstanceGraphComponent
} from '../time-series-instance-graph/time-series-instance-graph.component';
import { FormComponent } from '../form/form.component';
import { CompilationProperties } from '../../models/compilation-properties';
import { ChangeAnalysisOnboardingComponent } from '../changeanalysis-onboarding/changeanalysis-onboarding.component';
import { ChangesetsViewComponent } from '../changesets-view/changesets-view.component';
import { AppDependenciesComponent } from '../app-dependencies/app-dependencies.component';
import { SummaryCardsComponent } from '../summary-cards/summary-cards.component';
import { InsightsV4Component } from '../insights-v4/insights-v4.component';
import { DropdownV4Component } from '../dropdown-v4/dropdown-v4.component';
import { CardSelectionV4Component } from '../card-selection-v4/card-selection-v4.component';
import { VersionService } from '../../services/version.service';
import { ConnectAppInsightsComponent } from '../connect-app-insights/connect-app-insights.component';
import { DetectorSearchComponent } from '../detector-search/detector-search.component';
import { DynamicInsightV4Component } from '../dynamic-insight-v4/dynamic-insight-v4.component';

@Component({
  selector: 'dynamic-data',
  templateUrl: './dynamic-data.component.html',
  styleUrls: ['./dynamic-data.component.scss'],
  entryComponents: [
    TimeSeriesGraphComponent, DataTableComponent, DataSummaryComponent, EmailComponent,
    InsightsComponent, TimeSeriesInstanceGraphComponent, DynamicInsightComponent, MarkdownViewComponent,
    DetectorListComponent, DropdownComponent, CardSelectionComponent, SolutionComponent, GuageControlComponent, FormComponent,
    ChangeAnalysisOnboardingComponent, ChangesetsViewComponent, AppDependenciesComponent, AppInsightsMarkdownComponent, ConnectAppInsightsComponent, DetectorSearchComponent, SummaryCardsComponent, InsightsV4Component, DropdownV4Component, CardSelectionV4Component,DynamicInsightV4Component
  ]
})
export class DynamicDataComponent implements OnInit {

  private dataBehaviorSubject: BehaviorSubject<DiagnosticData> = new BehaviorSubject<DiagnosticData>(null);

  @Input() set diagnosticData(data: DiagnosticData) {
    this.dataBehaviorSubject.next(data);
  }

  @Input() startTime: Moment;
  @Input() endTime: Moment;
  @Input() detectorEventProperties: any;
  @Input() developmentMode: boolean = false;
  @Input() executionScript: string;
  @Input() detector: string = '';
  @Input() compilationPackage: CompilationProperties;
  @Input() isAnalysisView: boolean = false;
  @ViewChild('dynamicDataContainer', { read: ViewContainerRef, static: true }) dynamicDataContainer: ViewContainerRef;
  private isLegacy: boolean;
  constructor(private componentFactoryResolver: ComponentFactoryResolver, private versionService: VersionService) { }

  ngOnInit(): void {
    this.versionService.isLegacySub.subscribe(isLegacy => this.isLegacy = isLegacy);
    this.dataBehaviorSubject.subscribe((diagnosticData: DiagnosticData) => {
      const component = this._findInputComponent((<Rendering>diagnosticData.renderingProperties).type);
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
      const viewContainerRef = this.dynamicDataContainer;
      viewContainerRef.clear();

      const componentRef = viewContainerRef.createComponent(componentFactory);
      const instance = <DataRenderBaseComponent>(componentRef.instance);
      instance.diagnosticDataInput = diagnosticData;
      instance.startTime = this.startTime;
      instance.endTime = this.endTime;
      instance.detectorEventProperties = this.detectorEventProperties;
      instance.developmentMode = this.developmentMode;
      instance.executionScript = this.executionScript;
      instance.detector = this.detector;
      instance.compilationPackage = this.compilationPackage;
      instance.isAnalysisView = this.isAnalysisView;
    });
  }

  private _findInputComponent(type: RenderingType): any {
    switch (type) {
      case RenderingType.TimeSeries:
        return TimeSeriesGraphComponent;
      case RenderingType.Table:
        return DataTableComponent;
      case RenderingType.DataSummary:
        return DataSummaryComponent;
      case RenderingType.Email:
        return EmailComponent;
      case RenderingType.Insights:
        return this.isLegacy ? InsightsComponent : InsightsV4Component;
      case RenderingType.TimeSeriesPerInstance:
        return TimeSeriesInstanceGraphComponent;
      case RenderingType.DynamicInsight:
        return this.isLegacy? DynamicInsightComponent : DynamicInsightV4Component;
      case RenderingType.Markdown:
        return MarkdownViewComponent;
      case RenderingType.DetectorList:
        return DetectorListComponent;
      case RenderingType.DropDown:
        return this.isLegacy ? DropdownComponent : DropdownV4Component;
      case RenderingType.Cards:
        return this.isLegacy ? CardSelectionComponent : CardSelectionV4Component;
      case RenderingType.Solution:
        return SolutionComponent;
      case RenderingType.Guage:
        return GuageControlComponent;
      case RenderingType.Form:
        return FormComponent;
      case RenderingType.ChangeSets:
        return ChangesetsViewComponent;
      case RenderingType.ChangeAnalysisOnboarding:
        return ChangeAnalysisOnboardingComponent;
      case RenderingType.ApplicationInsightsView:
        return AppInsightsMarkdownComponent;
      case RenderingType.DependencyGraph:
        return AppDependenciesComponent;
      case RenderingType.SummaryCard:
        return SummaryCardsComponent;
      case RenderingType.SearchComponent:
        return DetectorSearchComponent;
      case RenderingType.AppInsightEnablement:
        return ConnectAppInsightsComponent;
      default:
        return null;
    }
  }

}
