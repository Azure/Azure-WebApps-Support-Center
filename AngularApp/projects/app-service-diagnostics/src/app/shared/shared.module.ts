import { PortalKustoTelemetryService } from './services/portal-kusto-telemetry.service';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { LimitToFilter } from './utilities/limitToFilter.pipe';
import { nvD3 } from './utilities/nvd3graph.component';
import { MarkupPipe } from './pipes/markup.pipe';
import { BlogComponent } from './components/blog/blog.component';
import { OpenTicketComponent } from './components/open-ticket/open-ticket.component';
import { DowntimeTimelineComponent } from './components/downtime-timeline/downtime-timeline.component';
import { ExpandableListItemComponent } from './components/expandable-list/expandable-list-item.component';
import { ExpandableListComponent } from './components/expandable-list/expandable-list.component';
import { SolutionsExpandableComponent } from './components/solutions-expandable/solutions-expandable.component';
import { DefaultSolutionsComponent } from './components/default-solutions/default-solutions.component';
import { MetricGraphComponent } from './components/metric-graph/metric-graph.component';
import { InstanceViewGraphComponent } from './components/instance-view-graph/instance-view-graph.component';
import { FeedbackFormComponent } from './components/feedback-form/feedback-form.component';
import { CollapsibleListItemComponent } from './components/collapsible-list/collapsible-list-item.component';
import { CollapsibleListComponent } from './components/collapsible-list/collapsible-list.component';
import { SupportToolsComponent } from './components/support-tools/support-tools.component';
import { ExpandableSummaryComponent } from './components/expandable-summary/expandable-summary.component';
import { LiveAgentChatComponent } from './components/liveagent-chat/liveagent-chat.component';
import { GroupByPipe } from './pipes/groupBy.pipe';
import { MapValuesPipe } from './pipes/mapValues.pipe';
import { StepWizardComponent } from './components/step-wizard/step-wizard.component';
import { DaasSessionsComponent, DateTimeDiffPipe } from './components/daas-sessions/daas-sessions.component';
import { WindowService } from '../startup/services/window.service';
import { ArmService } from './services/arm.service';
import {GenericArmConfigService} from './services/generic-arm-config.service';
import { UriElementsService } from './services/urielements.service';
import { PortalActionService } from './services/portal-action.service';
import { SiteService } from './services/site.service';
import { AppAnalysisService } from './services/appanalysis.service';
import { ServerFarmDataService } from './services/server-farm-data.service';
import { RBACService } from './services/rbac.service';
import { DetectorViewStateService } from './services/detector-view-state.service';
import { AppInsightsService } from './services/appinsights/appinsights.service';
import { AppInsightsQueryService } from './services/appinsights/appinsights-query.service';
import { CacheService } from './services/cache.service';
import { SolutionFactoryService } from './services/solution-factory.service';
import { DaasService } from './services/daas.service';
import { LiveChatService } from '../shared-v2/services/livechat.service';
import { ProfilerComponent } from './components/daas/profiler.component';
import { ProfilerToolComponent } from './components/tools/profiler-tool/profiler-tool.component';
import { DaasComponent } from './components/daas/daas.component';
import { MemoryDumpToolComponent } from './components/tools/memorydump-tool/memorydump-tool.component';
import { JavaMemoryDumpToolComponent } from './components/tools/java-memorydump-tool/java-memorydump-tool.component';
import { JavaThreadDumpToolComponent } from './components/tools/java-threaddump-tool/java-threaddump-tool.component';
import { IncidentNotificationComponent } from './components/incident-notification/incident-notification.component';
import { HttpLogAnalysisToolComponent } from './components/tools/http-loganalysis-tool/http-loganalysis-tool.component';
import { PhpProcessAnalyzerToolComponent } from './components/tools/php-processanalyzer-tool/php-processanalyzer-tool.component';
import { PhpLogsAnalyzerToolComponent } from './components/tools/php-logsanalyzer-tool/php-logsanalyzer-tool.component';
import { ConnectionDiagnoserToolComponent } from './components/tools/connection-diagnoser-tool/connection-diagnoser-tool.component';
import { NetworkTraceToolComponent } from './components/tools/network-trace-tool/network-trace-tool.component';
import { ServiceIncidentService } from './services/service-incident.service';
import { IncidentSummaryComponent } from './components/incident-summary/incident-summary.component';
import { DaasValidatorComponent } from './components/daas/daas-validator.component';
import { GenericApiService } from './services/generic-api.service';
import { TabTitleResolver } from './resolvers/tab-name.resolver';
import { AseService } from './services/ase.service';
import { LoggingService } from './services/logging/logging.service';
import { AvailabilityLoggingService } from './services/logging/availability.logging.service';
import { BotLoggingService } from './services/logging/bot.logging.service';
import { StartupModule } from '../startup/startup.module';
import { TabsComponent } from './components/tabs/tabs.component';
import { GenericDetectorComponent } from './components/generic-detector/generic-detector.component';
import { DiagnosticDataModule } from 'diagnostic-data';
import { AutohealingService } from './services/autohealing.service';
import { TimespanComponent } from './components/timespan/timespan.component';
import { ToggleButtonComponent } from './components/toggle-button/toggle-button.component';
import { ToolStackPipe, AppTypePipe, SkuPipe, PlatformPipe } from './pipes/categoryfilters.pipe';
import { DaasMainComponent } from './components/daas-main/daas-main.component';
import { DaasScaleupComponent } from './components/daas/daas-scaleup/daas-scaleup.component';
import { NotificationComponent } from './components/notification/notification.component';
import { NotificationService } from '../shared-v2/services/notification.service';
import { TestInputComponent } from './components/test-input/test-input.component';
import { ResourceRedirectComponent } from './components/resource-redirect/resource-redirect.component';
import { TileListComponent } from './components/tile-list/tile-list.component';
import { BackendCtrlService } from './services/backend-ctrl.service';
import { GenericCommsService } from './services/generic-comms.service';
import { GenericCommsComponent } from './components/generic-comms/generic-comms.component';
import { LocalBackendService } from './services/local-backend.service';
import { CpuMonitoringToolComponent } from './components/tools/cpu-monitoring-tool/cpu-monitoring-tool.component';
import { CpuMonitoringComponent } from './components/daas/cpu-monitoring/cpu-monitoring.component';
import { Ng5SliderModule } from 'ng5-slider';
import { CpuMonitoringConfigurationComponent } from './components/daas/cpu-monitoring/cpu-monitoring-configuration/cpu-monitoring-configuration.component';
import { CpuMonitoringActivityComponent } from './components/daas/cpu-monitoring/cpu-monitoring-activity/cpu-monitoring-activity.component';
import { CpuMonitoringSessionsComponent } from './components/daas/cpu-monitoring/cpu-monitoring-sessions/cpu-monitoring-sessions.component';
import { GenericAnalysisComponent } from './components/generic-analysis/generic-analysis.component';
import { EventViewerComponent } from './components/daas/event-viewer/event-viewer.component';
import { FrebViewerComponent } from './components/daas/freb-viewer/freb-viewer.component';
import { PortalReferrerResolverComponent } from './components/portal-referrer-resolver/portal-referrer-resolver.component';
import { ConfigureStorageAccountComponent } from './components/daas/configure-storage-account/configure-storage-account.component';

@NgModule({
    declarations: [
        LimitToFilter,
        nvD3,
        MarkupPipe,
        GroupByPipe,
        MapValuesPipe,
        DateTimeDiffPipe,
        ToolStackPipe,
        AppTypePipe,
        SkuPipe,
        PlatformPipe,
        BlogComponent,
        OpenTicketComponent,
        DowntimeTimelineComponent,
        ExpandableListComponent,
        ExpandableListItemComponent,
        DefaultSolutionsComponent,
        MetricGraphComponent,
        InstanceViewGraphComponent,
        SolutionsExpandableComponent,
        FeedbackFormComponent,
        CollapsibleListComponent,
        CollapsibleListItemComponent,
        SupportToolsComponent,
        ExpandableSummaryComponent,
        StepWizardComponent,
        DaasSessionsComponent,
        ProfilerComponent,
        ProfilerToolComponent,
        MemoryDumpToolComponent,
        DaasComponent,
        JavaMemoryDumpToolComponent,
        JavaThreadDumpToolComponent,
        IncidentNotificationComponent,
        HttpLogAnalysisToolComponent,
        PhpProcessAnalyzerToolComponent,
        PhpLogsAnalyzerToolComponent,
        ConnectionDiagnoserToolComponent,
        NetworkTraceToolComponent,
        IncidentSummaryComponent,
        DaasValidatorComponent,
        DaasMainComponent,
        LiveAgentChatComponent,
        TabsComponent,
        GenericDetectorComponent,
        TimespanComponent,
        ToggleButtonComponent,
        DaasScaleupComponent,
        NotificationComponent,
        TestInputComponent,
        ResourceRedirectComponent,
        TileListComponent,
        GenericCommsComponent,
        CpuMonitoringToolComponent,
        CpuMonitoringComponent,
        CpuMonitoringConfigurationComponent,
        CpuMonitoringActivityComponent,
        CpuMonitoringSessionsComponent,
        GenericAnalysisComponent,
        EventViewerComponent,
        FrebViewerComponent,
        PortalReferrerResolverComponent,
        ConfigureStorageAccountComponent
    ],
    imports: [
        HttpModule,
        CommonModule,
        StartupModule,
        FormsModule,
        RouterModule,
        DiagnosticDataModule,
        Ng5SliderModule
    ],
    exports: [
        CommonModule,
        FormsModule,
        HttpModule,
        LimitToFilter,
        RouterModule,
        nvD3,
        MarkupPipe,
        GroupByPipe,
        MapValuesPipe,
        DateTimeDiffPipe,
        ToolStackPipe,
        AppTypePipe,
        SkuPipe,
        PlatformPipe,
        BlogComponent,
        OpenTicketComponent,
        DowntimeTimelineComponent,
        ExpandableListComponent,
        ExpandableListItemComponent,
        DefaultSolutionsComponent,
        MetricGraphComponent,
        InstanceViewGraphComponent,
        SolutionsExpandableComponent,
        FeedbackFormComponent,
        CollapsibleListComponent,
        CollapsibleListItemComponent,
        SupportToolsComponent,
        ExpandableSummaryComponent,
        StepWizardComponent,
        DaasSessionsComponent,
        ProfilerComponent,
        ProfilerToolComponent,
        DaasComponent,
        DaasValidatorComponent,
        MemoryDumpToolComponent,
        JavaMemoryDumpToolComponent,
        JavaThreadDumpToolComponent,
        IncidentNotificationComponent,
        HttpLogAnalysisToolComponent,
        PhpProcessAnalyzerToolComponent,
        PhpLogsAnalyzerToolComponent,
        ConnectionDiagnoserToolComponent,
        NetworkTraceToolComponent,
        IncidentSummaryComponent,
        LiveAgentChatComponent,
        TabsComponent,
        GenericDetectorComponent,
        TimespanComponent,
        ToggleButtonComponent,
        DaasScaleupComponent,
        TileListComponent,
        GenericCommsComponent
    ]
})
export class SharedModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: SharedModule,
            providers: [
                WindowService,
                ArmService,
                GenericArmConfigService,
                UriElementsService,
                PortalActionService,
                SiteService,
                AppAnalysisService,
                ServerFarmDataService,
                RBACService,
                LoggingService,
                AvailabilityLoggingService,
                BotLoggingService,
                PortalKustoTelemetryService,
                DetectorViewStateService,
                AppInsightsService,
                AppInsightsQueryService,
                CacheService,
                SolutionFactoryService,
                DaasService,
                ServiceIncidentService,
                GenericApiService,
                TabTitleResolver,
                AseService,
                LiveChatService,
                AutohealingService,
                NotificationService,
                BackendCtrlService,
                GenericCommsService,
                GroupByPipe,
                LocalBackendService
            ]
        };
    }
}
