import { NgModule, ModuleWithProviders } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AvailabilityModule } from '../availability/availability.module';
import { SolutionsModule } from '../solutions/solutions.module';

import { StartupMessages } from './message-flow/startup/startupmessages';
import { MainMenuMessageFlow } from './message-flow/main-menu/mainmenumessageflow';
import { HealthCheckMessageFlow } from './message-flow/health-check/healthcheckmessageflow';
import { FeedbackMessageFlow } from './message-flow/feedback/feedbackmessageflow';
import { TalkToAgentMessageFlow } from './message-flow/talk-to-agent/talktoagentmessageflow';
import { MessageProcessor } from './message-processor.service';

import { HomepageComponent } from './homepage/homepage.component';
import { SupportBotComponent } from './support-bot.component';
import { DynamicComponent } from './dynamic-component/dynamic.component';
import { TextMessageComponent } from './common/text-message/text-message.component';
import { ButtonMessageComponent } from './common/button-message/button-message.component';
import { LoadingMessageComponent } from './common/loading-message/loading-message.component';
import { MainMenuComponent, ToolStackPipe, PlatformPipe, AppTypePipe, SkuPipe } from './message-flow/main-menu/main-menu.component';
import { HealthCheckComponent } from './message-flow/health-check/health-check.component';
import { TalkToAgentMessageComponent } from './message-flow/talk-to-agent/talk-to-agent-message.component';
import { FeedbackComponent } from './message-flow/feedback/feedback.component';
import { SolutionsMessageComponent } from './common/solutions-message/solutions-message.component';
import { GraphMessageComponent } from './common/graph-message/graph-message.component';
import { CpuAnalysisChatFlow } from './message-flow/cpu-analysis-chat/cpu-analysis-chat-flow';
import { ProblemStatementMessageComponent } from './common/problem-statement-message/problem-statement-message.component';

import { AppInsightsSettingsComponent } from '../availability/app-insights/app-insights-settings.component';
import { CategoryMenuComponent } from './message-flow/category-menu/category-menu.component';
import { DetectorSummaryComponent } from './message-flow/detector-summary/detector-summary.component';
import { DocumentSearchComponent } from './message-flow/document-search/document-search.component';
import { DocumentSearchResultsComponent } from './message-flow/document-search-results/document-search-results.component';
import { SharedV2Module } from '../shared-v2/shared-v2.module';
import { DiagnosticDataModule } from 'applens-diagnostics';
import { GenericCategoryFlow } from './message-flow/v2-flows/generic-category.flow';
import { AvailabilityPerformanceFlow } from './message-flow/v2-flows/availability-performance.flow';

const _siteResourceUrl: string = 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/sites/:sitename';
const _slotResourceUrl: string = 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/sites/:sitename/slots/:slot';
const _hostingEnvironmentResourceUrl: string = 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/hostingenvironments/:name';


@NgModule({
    declarations: [
        HomepageComponent,
        SupportBotComponent,
        DynamicComponent,
        TextMessageComponent,
        LoadingMessageComponent,
        MainMenuComponent,
        ButtonMessageComponent,
        HealthCheckComponent,
        TalkToAgentMessageComponent,
        FeedbackComponent,
        SolutionsMessageComponent,
        GraphMessageComponent,
        ProblemStatementMessageComponent,
        CategoryMenuComponent,
        DetectorSummaryComponent,
        ToolStackPipe,
        PlatformPipe,
        AppTypePipe,
        SkuPipe,
        DocumentSearchComponent,
        DocumentSearchResultsComponent
    ],
    imports: [
        RouterModule.forChild(
            [{
                path: _siteResourceUrl + '/diagnostics',
                component: HomepageComponent,
                data: {
                    navigationTitle: 'Legacy Home',
                    cacheComponent: true
                }
            },
            {
                path: _slotResourceUrl + '/diagnostics',
                component: HomepageComponent,
                data: {
                    navigationTitle: 'Legacy Home',
                    cacheComponent: true
                }
            },
            {
                path: _hostingEnvironmentResourceUrl + '/diagnostics',
                component: HomepageComponent,
                data: {
                    navigationTitle: 'Legacy Home',
                    cacheComponent: true
                }
            },
            {
                path: _siteResourceUrl + '/diagnostics/settings/appinsights',
                component: AppInsightsSettingsComponent,
                data: {
                    navigationTitle: 'Application Insights Settings'
                }
            },
            {
                path: _slotResourceUrl + '/diagnostics/settings/appinsights Settings',
                component: AppInsightsSettingsComponent,
                data: {
                    navigationTitle: 'Application Insights'
                }
            }]
        ),
        SharedModule,
        AvailabilityModule,
        SolutionsModule,
        SharedV2Module,
        DiagnosticDataModule
    ],
    exports: [
        HomepageComponent,
        SupportBotComponent,
        CategoryMenuComponent,
        DetectorSummaryComponent
    ],
    providers: [
        StartupMessages,
        MainMenuMessageFlow,
        HealthCheckMessageFlow,
        FeedbackMessageFlow,
        CpuAnalysisChatFlow,
        TalkToAgentMessageFlow,
        MessageProcessor,
        AvailabilityPerformanceFlow,
        GenericCategoryFlow
    ]
})
export class SupportBotModule {
}