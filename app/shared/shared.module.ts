import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import {
    PortalService, BroadcastService, AuthService, ArmService, UriElementsService, PortalActionService,
    SiteService, AppAnalysisService, WindowService, ServerFarmDataService, RBACService, LoggingService,     
    AvailabilityLoggingService, BotLoggingService, DetectorViewStateService, CacheService, SolutionFactoryService, DaasService
} from './services';
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
import { GroupByPipe } from './pipes/groupBy.pipe';
import { MapValuesPipe } from './pipes/mapValues.pipe';



@NgModule({
    declarations: [
        LimitToFilter,
        nvD3,
        MarkupPipe,       
        GroupByPipe,
        MapValuesPipe,
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
        SolutionTypeTagComponent
    ],
    imports: [
        HttpModule,
        CommonModule,
        FormsModule
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
        SolutionTypeTagComponent
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
                SolutionFactoryService,
                DaasService,
                CacheService                
            ]
        }
    }
}