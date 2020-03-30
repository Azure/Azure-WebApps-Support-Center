import { NgModule, ModuleWithProviders } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { FabricModule } from '../fabric-ui/fabric.module';
import { SolutionsModule } from '../solutions/solutions.module';
import { StartupMessages } from './message-flow/startup/startupmessages';
import { Geniefeedbackmessageflow } from './message-flow/genie-feedback/geniefeedbackmessageflow';
import { GenieMessageProcessor } from './message-processor.service';
import { GenieTextMessageComponent } from './common/text-message/text-message.component';
import { ButtonMessageComponent } from './common/button-message/button-message.component';
import { FeedbackButtonMessageComponent } from './common/feedback-button-message/feedback-button-message.component';
import { LoadingMessageComponent } from './common/loading-message/loading-message.component';
import { TalkToAgentMessageComponent } from './message-flow/talk-to-agent/talk-to-agent-message.component';
import { GenieFeedbackComponent } from './message-flow/genie-feedback/genie-feedback.component'
import { SolutionsMessageComponent } from './common/solutions-message/solutions-message.component';
import { GraphMessageComponent } from './common/graph-message/graph-message.component';
import { DocumentSearchComponent } from './message-flow/document-search/document-search.component';
import { DocumentSearchResultsComponent } from './message-flow/document-search-results/document-search-results.component';
import { SharedV2Module } from '../shared-v2/shared-v2.module';
import { DiagnosticDataModule } from 'diagnostic-data';
import { GenieChatFlow } from './message-flow/v2-flows/genie-chat.flow';
import { HealthCheckV3Component } from './message-flow/health-check-v3/health-check-v3.component';
import { FabIconModule,FabChoiceGroupModule } from '@angular-react/fabric';
import { DynamicAnalysisComponent } from './message-flow/dynamic-analysis/dynamic-analysis.component';
import { GeniePanelComponent } from '../fabric-ui/components/genie-panel/genie-panel.component';
import { GenieDynamicComponent} from './dynamic-component/genie-dynamic.component';
import { CommonModule } from '@angular/common';
import { FabPanelModule } from '@angular-react/fabric';

@NgModule({
    declarations: [
        GenieTextMessageComponent,
        LoadingMessageComponent,
        ButtonMessageComponent,
        FeedbackButtonMessageComponent,
        TalkToAgentMessageComponent,
        GenieFeedbackComponent,
        SolutionsMessageComponent,
        GraphMessageComponent,
        DocumentSearchComponent,
        DocumentSearchResultsComponent,
        HealthCheckV3Component,
        DynamicAnalysisComponent,
        GeniePanelComponent,
        GenieDynamicComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        FabricModule,
        SolutionsModule,
        SharedV2Module,
        DiagnosticDataModule,
        FabIconModule,
        FabChoiceGroupModule,
        FabPanelModule
    ],
    exports: [
        HealthCheckV3Component,
        LoadingMessageComponent,
        GeniePanelComponent,
        GenieDynamicComponent
    ],
    providers: [
        StartupMessages,
        Geniefeedbackmessageflow,
        GenieMessageProcessor,
        GenieChatFlow
    ]
})
export class GenieModule {
}
