import { NgModule } from '@angular/core';
import { SharedV2Module } from '../../shared-v2/shared-v2.module';
import { SharedModule } from '../../shared/shared.module';
import { ResourceService } from '../../shared-v2/services/resource.service';
import { ResourceResolver } from '../../home/resolvers/resource.resolver';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../shared-v2/services/category.service';
import { SitesCategoryService } from './services/sites-category.service';
import { SiteFeatureService } from './services/site-feature.service';
import { FeatureService } from '../../shared-v2/services/feature.service';
import { SupportTopicService } from '../../shared-v2/services/support-topic.service';
import { SiteSupportTopicService } from './services/site-support-topic.service';
import { WebSiteFilter } from './pipes/site-filter.pipe';
import { DiagnosticToolsComponent } from './components/diagnostic-tools/diagnostic-tools.component';
import { ContentService } from '../../shared-v2/services/content.service';
import { WebSitesService } from './services/web-sites.service';
import { LoggingV2Service } from '../../shared-v2/services/logging-v2.service';
import { LiveChatService } from '../../shared-v2/services/livechat.service';
import { CXPChatCallerService } from '../../shared-v2/services/cxp-chat-caller.service';

const ResourceRoutes = RouterModule.forChild([
  {
    path: '',
    loadChildren: '../../home/home.module#HomeModule',
     resolve: { data: ResourceResolver }
  },
  {
    path: 'diagnosticTools',
    component: DiagnosticToolsComponent,
    data: {
      navigationTitle: 'Diagnostic Tools',
      cacheComponent: true
    }
  },
  {
    path: 'legacy',
    loadChildren: '../../availability/availability.module#AvailabilityModule'
  },
  {
    path: 'tools',
    loadChildren: '../../diagnostic-tools/diagnostic-tools.module#DiagnosticToolsModule'
  }
]);

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SharedV2Module,
    ResourceRoutes
  ],
  declarations: [
    DiagnosticToolsComponent,
    WebSiteFilter
  ],
  providers: [
    ContentService,
    SiteFeatureService,
    LoggingV2Service,
    LiveChatService,
    CXPChatCallerService,
    { provide: ResourceService, useExisting: WebSitesService },
    { provide: CategoryService, useClass: SitesCategoryService },
    { provide: FeatureService, useExisting: SiteFeatureService },
    { provide: SupportTopicService, useClass: SiteSupportTopicService },
    ResourceResolver,
    WebSiteFilter
  ]
})
export class WebSitesModule { }
