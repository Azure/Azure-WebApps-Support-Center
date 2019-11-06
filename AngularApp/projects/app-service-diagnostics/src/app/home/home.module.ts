import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { SharedV2Module } from '../shared-v2/shared-v2.module';
import { GenericSupportTopicService} from 'diagnostic-data';
import { HomeComponent } from './components/home/home.component';
import { CategoryChatComponent } from './components/category-chat/category-chat.component';
import { CategoryTileComponent } from './components/category-tile/category-tile.component';
import { CategoryTabResolver, CategoryChatResolver } from './resolvers/category-tab.resolver';
import { SupportBotModule } from '../supportbot/supportbot.module';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { FormsModule } from '@angular/forms';
import { GenericDetectorComponent } from '../shared/components/generic-detector/generic-detector.component';
import { TabTitleResolver } from '../shared/resolvers/tab-name.resolver';
import { SupportTopicRedirectComponent } from './components/support-topic-redirect/support-topic-redirect.component';
import { TimeControlResolver } from './resolvers/time-control.resolver';
import { ContentService } from '../shared-v2/services/content.service';
import { FabNavModule, DiagnosticDataModule } from 'diagnostic-data';
import { GenericAnalysisComponent } from '../shared/components/generic-analysis/generic-analysis.component';
import { CategoryOverviewComponent } from '../shared/components/category-overview/category-overview.component';
import { DiagnosticsSettingsComponent } from './components/diagnostics-settings/diagnostics-settings.component';
import { SupportTopicService } from '../shared-v2/services/support-topic.service';
import {
    FabBreadcrumbModule,
    FabButtonModule,
    FabCalendarModule,
    FabCalloutModule,
    FabCheckboxModule,
    FabChoiceGroupModule,
    FabComboBoxModule,
    FabCommandBarModule,
    FabDatePickerModule,
    FabDetailsListModule,
    FabDialogModule,
    FabDividerModule,
    FabFabricModule,
    FabDropdownModule,
    FabGroupModule,
    FabGroupedListModule,
    FabHoverCardModule,
    FabIconModule,
    FabImageModule,
    FabLinkModule,
    FabMarqueeSelectionModule,
    FabMessageBarModule,
    FabModalModule,
    FabPanelModule,
    FabPersonaModule,
    FabPivotModule,
    FabSearchBoxModule,
    FabShimmerModule,
    FabSliderModule,
    FabSpinnerModule,
    FabToggleModule,
    FabTooltipModule,
    FabSpinButtonModule,
    FabTextFieldModule,
    FabPeoplePickerModule,
    FabTagPickerModule,
    FabProgressIndicatorModule,
  } from '@angular-react/fabric';

export const HomeRoutes = RouterModule.forChild([
  {
    path: '',
    component: HomeComponent,
    data: {
      navigationTitle: 'Home',
      cacheComponent: true
    },
  },
  {
    path: 'categories/:category',
    component: CategoryChatComponent,
    // data: {
    //   cacheComponent: true
    // },
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        component: CategoryOverviewComponent,
      },
      {
        path: 'analysis/:analysisId',
        component: GenericAnalysisComponent,
        data: {
          cacheComponent: true
        },
        children: [
          {
            path: '',
            component: GenericDetectorComponent,
            data: {
              analysisMode: true,
              cacheComponent: true
            }
          }
        ],
        resolve: {
          time: TimeControlResolver,
          navigationTitle: TabTitleResolver,
        }
      },
      {
        path: 'detectors/:detectorName',
        component: GenericDetectorComponent,
        data: {
          cacheComponent: true
        },
        resolve: {
          time: TimeControlResolver,
          navigationTitle: TabTitleResolver,
        }
      },
      {
        path: 'analysis/:analysisId/detectors/:detectorName',
        component: GenericAnalysisComponent,
        data: {
          cacheComponent: true
        },
        children: [
          {
            path: '',
            component: GenericDetectorComponent,
            data: {
              analysisMode: true,
              cacheComponent: true
            }
          }
        ],
        resolve: {
          time: TimeControlResolver,
          navigationTitle: TabTitleResolver,
        }
      }
    ],
    resolve: {
      navigationTitle: CategoryTabResolver,
      messageList: CategoryChatResolver
    }
  },
  // {
  //   path: 'detectors/:detectorName',
  //   component: GenericDetectorComponent,
  //   data: {
  //     cacheComponent: true
  //   },
  //   resolve: {
  //     time: TimeControlResolver,
  //     navigationTitle: TabTitleResolver,
  //   }
  // },
  // {
  //   path: 'analysis/:analysisId/detectors/:detectorName',
  //   component: GenericAnalysisComponent,
  //   data: {
  //     cacheComponent: true
  //   },
  //   children: [
  //     {
  //       path: '',
  //       component: GenericDetectorComponent,
  //       data: {
  //         analysisMode: true,
  //         cacheComponent: true
  //       }
  //     }
  //   ],
  //   resolve: {
  //     time: TimeControlResolver,
  //     navigationTitle: TabTitleResolver,
  //   }
  // },
  // {
  //   path: 'analysis/:analysisId',
  //   component: GenericAnalysisComponent,
  //   data: {
  //     cacheComponent: true
  //   },
  //   children: [
  //     {
  //       path: '',
  //       component: GenericDetectorComponent,
  //       data: {
  //         analysisMode: true,
  //         cacheComponent: true
  //       }
  //     }
  //   ],
  //   resolve: {
  //     time: TimeControlResolver,
  //     navigationTitle: TabTitleResolver,
  //   }
  // },
  {
    path: 'analysis/:analysisId/search',
    component: GenericAnalysisComponent,
    data: {
      cacheComponent: true
    },
    children: [
      {
        path: '',
        component: GenericDetectorComponent,
        data: {
          analysisMode: true,
          cacheComponent: true
        }
      }
    ],
    resolve: {
      time: TimeControlResolver,
      navigationTitle: TabTitleResolver,
    }
  },
  // {
  //   path: 'analysis/:analysisId/search/detectors/:detectorName',
  //   component: GenericAnalysisComponent,
  //   data: {
  //     cacheComponent: true
  //   },
  //   children: [
  //     {
  //       path: '',
  //       component: GenericDetectorComponent,
  //       data: {
  //         analysisMode: true,
  //         cacheComponent: true
  //       }
  //     }
  //   ],
  //   resolve: {
  //     time: TimeControlResolver,
  //     navigationTitle: TabTitleResolver,
  //   }
  // },
  {
    path: 'analysis/:analysisId/detectors',
    component: GenericAnalysisComponent,
    data: {
      cacheComponent: true
    },
    children: [
      {
        path: '',
        component: GenericDetectorComponent,
        data: {
          analysisMode: true,
          cacheComponent: true
        }
      }
    ],
    resolve: {
      time: TimeControlResolver,
      navigationTitle: TabTitleResolver,
    }
  },
  {
    path: 'supportTopicId',
    component: SupportTopicRedirectComponent
  },
  {
    path: 'settings',
    component: DiagnosticsSettingsComponent,
    data: {
      navigationTitle: 'App Service Diagnostics Settings'
    }
  },
]);

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    DiagnosticDataModule,
    HomeRoutes,
    SupportBotModule,
    FormsModule,
    FabFabricModule,
    FabIconModule,
    FabButtonModule,
    FabDialogModule,
    FabImageModule,
    FabDropdownModule,
    FabPanelModule,
    FabCommandBarModule,
    FabBreadcrumbModule,
    FabCalloutModule,
    FabCheckboxModule,
    FabChoiceGroupModule,
    FabComboBoxModule,
    FabGroupedListModule,
    FabDatePickerModule,
    FabDividerModule,
    FabSpinnerModule,
    FabToggleModule,
    FabPersonaModule,
    FabPivotModule,
    FabLinkModule,
    FabMessageBarModule,
    FabHoverCardModule,
    FabModalModule,
    FabTooltipModule,
    FabShimmerModule,
    FabSliderModule,
    FabSearchBoxModule,
    FabCalendarModule,
    FabDetailsListModule,
    FabGroupModule,
    FabMarqueeSelectionModule,
    FabSpinButtonModule,
    FabTextFieldModule,
    FabPeoplePickerModule,
    FabTagPickerModule,
    FabProgressIndicatorModule,
    FabNavModule
  ],
  declarations: [HomeComponent, CategoryChatComponent, CategoryTileComponent, SearchResultsComponent, SupportTopicRedirectComponent, DiagnosticsSettingsComponent,CategoryOverviewComponent],
  providers: [CategoryTabResolver, CategoryChatResolver, TimeControlResolver,
    { provide: GenericSupportTopicService, useExisting: SupportTopicService}
  ]
})
export class HomeModule { }
