import {
  CommsService, DiagnosticDataModule, DiagnosticService, DiagnosticSiteService,
  PUBLIC_DEV_CONFIGURATION, PUBLIC_PROD_CONFIGURATION, SolutionService, SettingsService, BackendCtrlQueryService, GenieGlobals, VersionService
} from 'diagnostic-data';
import { SiteService } from 'projects/app-service-diagnostics/src/app/shared/services/site.service';
import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy, RouterModule } from '@angular/router';
import {
  KustoTelemetryService
} from '../../../diagnostic-data/src/lib/services/telemetry/kusto-telemetry.service';
import {
  UnhandledExceptionHandlerService
} from '../../../diagnostic-data/src/lib/services/unhandled-exception-handler.service';
import { environment } from '../environments/environment';
import { CustomReuseStrategy } from './app-route-reusestrategy.service';
import { AppComponent } from './app.component';
import {
  ResourceRedirectComponent
} from './shared/components/resource-redirect/resource-redirect.component';
import { TestInputComponent } from './shared/components/test-input/test-input.component';
import { GenericApiService } from './shared/services/generic-api.service';
import { GenericCommsService } from './shared/services/generic-comms.service';
import { GenericSolutionService } from './shared/services/generic-solution.service';
import { LocalBackendService } from './shared/services/local-backend.service';
import { PortalKustoTelemetryService } from './shared/services/portal-kusto-telemetry.service';
import { SharedModule } from './shared/shared.module';
import { ContentService } from './shared-v2/services/content.service';
import { CategoryChatStateService } from './shared-v2/services/category-chat-state.service';
import { StartupModule } from './startup/startup.module';
import { CustomMaterialModule } from './material-module';
import { PortalSettingsService } from './shared/services/settings.service';
import { AppInsightsService } from './shared/services/appinsights/appinsights.service';
import { AppInsightsQueryService } from './../../../diagnostic-data/src/lib/services/appinsights.service';
import { HighchartsChartModule } from 'highcharts-angular';
import { AngularReactBrowserModule } from '@angular-react/core';
import { Globals } from './globals';
import { CategoryService } from './shared-v2/services/category.service';
import { FeatureService } from './shared-v2/services/feature.service';
import { LoggingV2Service } from './shared-v2/services/logging-v2.service';
import { LiveChatService } from './shared-v2/services/livechat.service';
import { SupportTopicService } from './shared-v2/services/support-topic.service';
import { ResourceResolver } from './home/resolvers/resource.resolver';
import { ResourcesModule } from './resources/resources.module';
import { WebSitesModule } from './resources/web-sites/web-sites.module';
import { VersionTestService } from './fabric-ui/version-test.service';
import { BackendCtrlService } from './shared/services/backend-ctrl.service';
import { GenieModule } from './genie/genie.module';


@NgModule({
  imports: [
    AngularReactBrowserModule,
    HttpClientModule,
    ResourcesModule,
    WebSitesModule,
    SharedModule.forRoot(),
    StartupModule.forRoot(),
    DiagnosticDataModule.forRoot(environment.production ? PUBLIC_PROD_CONFIGURATION : PUBLIC_DEV_CONFIGURATION),
    BrowserAnimationsModule,
    RouterModule.forRoot([
      {
        path: 'test',
        component: TestInputComponent,
      },
      {
        path: 'resourceRedirect',
        component: ResourceRedirectComponent,
      },
      {
        path: 'resource',
        loadChildren: './resources/resources.module#ResourcesModule',
      }
    ],
    ),
    CustomMaterialModule,
    HighchartsChartModule,
    GenieModule
  ],
  declarations: [
    AppComponent,
  ],
  providers: [
    CustomReuseStrategy,
    { provide: KustoTelemetryService, useExisting: PortalKustoTelemetryService },
    { provide: RouteReuseStrategy, useExisting: CustomReuseStrategy },
    {
      provide: DiagnosticService,
      useFactory: (_localBackendService: LocalBackendService, _genericApiService: GenericApiService) => environment.useApplensBackend ? _localBackendService : _genericApiService,
      deps: [LocalBackendService, GenericApiService]
    },
    { provide: CommsService, useExisting: GenericCommsService },
    { provide: AppInsightsQueryService, useExisting: AppInsightsService },
    { provide: DiagnosticSiteService, useExisting: SiteService },
    {
      provide: ErrorHandler,
      useClass: UnhandledExceptionHandlerService
    },
    { provide: SolutionService, useExisting: GenericSolutionService },
    { provide: SettingsService, useExisting: PortalSettingsService },
    { provide: GenieGlobals, useExisting: Globals },
    CategoryChatStateService,
    ContentService,
    CategoryService,
    FeatureService,
    LoggingV2Service,
    LiveChatService,
    SupportTopicService,
    ResourceResolver,
    { provide: VersionService, useExisting: VersionTestService },
    { provide: BackendCtrlQueryService, useExisting: BackendCtrlService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
