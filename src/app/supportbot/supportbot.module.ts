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
import { MainMenuComponent } from './message-flow/main-menu/main-menu.component';
import { HealthCheckComponent } from './message-flow/health-check/health-check.component';
import { TalkToAgentMessageComponent } from './message-flow/talk-to-agent/talk-to-agent-message.component';
import { FeedbackComponent } from './message-flow/feedback/feedback.component';
import { SolutionsMessageComponent } from './common/solutions-message/solutions-message.component';
import { GraphMessageComponent } from './common/graph-message/graph-message.component';
import { CpuAnalysisChatFlow } from './message-flow/cpu-analysis-chat/cpu-analysis-chat-flow';
import { ProblemStatementMessageComponent } from './common/problem-statement-message/problem-statement-message.component';

import { AppInsightsSettingsComponent } from '../availability/app-insights/app-insights-settings.component';

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
        ProblemStatementMessageComponent
    ],
    imports: [
        RouterModule.forChild(
            [{
                path: _siteResourceUrl + '/diagnostics',
                component: HomepageComponent,
                data: {
                    navigationTitle: 'Home',
                    cacheComponent: true
                }
            },
            {
                path: _slotResourceUrl + '/diagnostics',
                component: HomepageComponent,
                data: {
                    navigationTitle: 'Home',
                    cacheComponent: true
                }
            },
            {
                path: _hostingEnvironmentResourceUrl + '/diagnostics',
                component: HomepageComponent,
                data: {
                    navigationTitle: 'Home',
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
        SolutionsModule
    ],
    exports: [
        HomepageComponent
    ],
    providers: [
        StartupMessages,
        MainMenuMessageFlow,
        HealthCheckMessageFlow,
        FeedbackMessageFlow,
        CpuAnalysisChatFlow,
        TalkToAgentMessageFlow,
        MessageProcessor
    ]
})
export class SupportBotModule {
}