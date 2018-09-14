import { NgModule } from '@angular/core';
import { SharedV2Module } from '../../shared-v2/shared-v2.module';
import { SharedModule } from '../../shared/shared.module';
import { ResourceService } from '../../shared-v2/services/resource.service';
import { WebSitesService } from '../../shared-v2/services/web-sites.service';
import { ResourceResolver } from '../../home/resolvers/resource.resolver';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../shared-v2/services/category.service';
import { SitesCategoryService } from './services/sites-category.service';
import { SiteFeatureService } from './services/site-feature.service';
import { FeatureService } from '../../shared-v2/services/feature.service';
import { SupportTopicService } from '../../shared-v2/services/support-topic.service';
import { SiteSupportTopicService } from './services/site-support-topic.service';
import { WebSiteFilter } from './pipes/site-filter.pipe';
import { DiagnosticToolsComponent } from './components/diagnostic-tools/diagnostic-tools.component';

const ResourceRoutes = RouterModule.forChild([
  {
    path: '',
    loadChildren: 'app/home/home.module#HomeModule',
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
    path: 'tools',
    loadChildren: 'app/diagnostic-tools/diagnostic-tools.module#DiagnosticToolsModule'
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
    WebSitesService,
    SiteFeatureService,
    { provide: ResourceService, useExisting: WebSitesService },
    { provide: CategoryService, useClass: SitesCategoryService },
    { provide: FeatureService, useExisting: SiteFeatureService },
    { provide: SupportTopicService, useClass: SiteSupportTopicService },
    ResourceResolver
  ]
})
export class WebSitesModule { }