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
import { VerticalDisplayListComponent } from './components/vertical-display-list/vertical-display-list.component';
import { VerticalDisplayListItemComponent } from './components/vertical-display-list/vertical-display-list-item/vertical-display-list-item.component';
import { SolutionTypeTagComponent } from './components/solution-type-tag/solution-type-tag.component';
import { LiveAgentChatComponent } from './components/liveagent-chat/liveagent-chat.component';
import { GroupByPipe } from './pipes/groupBy.pipe';
import { MapValuesPipe } from './pipes/mapValues.pipe';
import { StepWizardComponent } from './components/step-wizard/step-wizard.component';
import { DaasSessionsComponent, DateTimeDiffPipe } from './components/daas-sessions/daas-sessions.component';
import { WindowService } from './services/window.service';
import { PortalService } from './services/portal.service';
import { BroadcastService } from './services/broadcast.service';
import { AuthService } from './services/auth.service';
import { ArmService } from './services/arm.service';
import { UriElementsService } from './services/urielements.service';
import { PortalActionService } from './services/portal-action.service';
import { SiteService } from './services/site.service';
import { AppAnalysisService } from './services/appanalysis.service';
import { ServerFarmDataService } from './services/server-farm-data.service';
import { RBACService } from './services/rbac.service';
import { LoggingService } from './services/logging/logging.service';
import { AvailabilityLoggingService } from './services/logging/availability.logging.service';
import { BotLoggingService } from './services/logging/bot.logging.service';
import { DetectorViewStateService } from './services/detector-view-state.service';
import { AppInsightsService } from './services/appinsights/appinsights.service';
import { AppInsightsQueryService } from './services/appinsights/appinsights-query.service';
import { CacheService } from './services/cache.service';
import { SolutionFactoryService } from './services/solution-factory.service';
import { DaasService } from './services/daas.service';
import { LiveChatService } from './services/livechat.service';
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
import { ScrollingTileComponent } from './components/scrolling-tile/scrolling-tile.component';
import { NguCarouselModule } from '@ngu/carousel';
import { ConnectionDiagnoserToolComponent } from './components/tools/connection-diagnoser-tool/connection-diagnoser-tool.component';
import { NetworkTraceToolComponent } from './components/tools/network-trace-tool/network-trace-tool.component';
import { ServiceIncidentService } from './services/service-incident.service';
import { IncidentSummaryComponent } from './components/incident-summary/incident-summary.component';
import { DaasValidatorComponent } from './components/daas/daas-validator.component';
import { DaasSessionsDetailedComponent } from './components/daas-sessions-detailed/daas-sessions-detailed.component';
import { GenericApiService } from './services/generic-api.service';
import { TabTitleResolver } from './resolvers/tab-name.resolver';
import { AseService } from './services/ase.service';
import { AutohealingService } from './services/autohealing.service';
import { FormattingService } from './services/formatting.service';
import { TimespanComponent } from './components/timespan/timespan.component';
import { AutohealingComponent } from './components/autohealing/autohealing.component';
import { AutohealingSlowrequestsRuleComponent } from './components/autohealing/autohealing-slowrequests-rule/autohealing-slowrequests-rule.component';
import { AutohealingMemoryRuleComponent } from './components/autohealing/autohealing-memory-rule/autohealing-memory-rule.component';
import { AutohealingRequestsRuleComponent } from './components/autohealing/autohealing-requests-rule/autohealing-requests-rule.component';
import { AutohealingStatuscodesRuleComponent } from './components/autohealing/autohealing-statuscodes-rule/autohealing-statuscodes-rule.component';
import { AutohealingCustomActionComponent } from './components/autohealing/autohealing-custom-action/autohealing-custom-action.component';
import { ToggleButtonComponent } from './components/toggle-button/toggle-button.component';

@NgModule({
    declarations: [
        LimitToFilter,
        nvD3,
        MarkupPipe,
        GroupByPipe,
        MapValuesPipe,
        DateTimeDiffPipe,
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
        VerticalDisplayListComponent,
        VerticalDisplayListItemComponent,
        SolutionTypeTagComponent,
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
        ScrollingTileComponent,
        ConnectionDiagnoserToolComponent,
        NetworkTraceToolComponent,
        IncidentSummaryComponent,
        DaasValidatorComponent,
        DaasSessionsDetailedComponent,
        LiveAgentChatComponent,
        AutohealingComponent,
        AutohealingSlowrequestsRuleComponent,
        AutohealingMemoryRuleComponent,
        AutohealingRequestsRuleComponent,
        AutohealingStatuscodesRuleComponent,
        TimespanComponent,
        AutohealingCustomActionComponent,
        ToggleButtonComponent
    ],
    imports: [
        HttpModule,
        CommonModule,
        FormsModule,
        RouterModule,
        NguCarouselModule
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
        VerticalDisplayListComponent,
        VerticalDisplayListItemComponent,
        SolutionTypeTagComponent,
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
        ScrollingTileComponent,
        ConnectionDiagnoserToolComponent,
        NetworkTraceToolComponent,
        IncidentSummaryComponent,
        LiveAgentChatComponent
    ]
})
export class SharedModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: SharedModule,
            providers: [
                WindowService,
                PortalService,
                BroadcastService,
                AuthService,
                ArmService,
                UriElementsService,
                PortalActionService,
                SiteService,
                AppAnalysisService,
                ServerFarmDataService,
                RBACService,
                LoggingService,
                AvailabilityLoggingService,
                BotLoggingService,
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
                FormattingService
            ]
        }
    }
}