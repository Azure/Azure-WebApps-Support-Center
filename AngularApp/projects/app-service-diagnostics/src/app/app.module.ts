import { KustoTelemetryService } from './../../../diagnostic-data/src/lib/services/telemetry/kusto-telemetry.service';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, RouteReuseStrategy } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';
import { CustomReuseStrategy } from './app-route-reusestrategy.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StartupModule } from './startup/startup.module';
import { TestInputComponent } from './shared/components/test-input/test-input.component';
import { ResourceRedirectComponent } from './shared/components/resource-redirect/resource-redirect.component';
import { PUBLIC_PROD_CONFIGURATION, DiagnosticDataModule, DiagnosticService, CommsService, PUBLIC_DEV_CONFIGURATION } from 'diagnostic-data';
import { GenericApiService } from './shared/services/generic-api.service';
import { GenericCommsService } from './shared/services/generic-comms.service';
import { environment } from '../environments/environment';
import { PortalKustoTelemetryService } from './shared/services/portal-kusto-telemetry.service';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedModule.forRoot(),
    StartupModule.forRoot(),
    DiagnosticDataModule.forRoot(environment.production ? PUBLIC_PROD_CONFIGURATION : PUBLIC_DEV_CONFIGURATION),
    BrowserAnimationsModule,
    RouterModule.forRoot([
      {
        path: 'test',
        component: TestInputComponent
      },
      {
        path: 'resourceRedirect',
        component: ResourceRedirectComponent
      },
      {
        path: 'resource',
        loadChildren: './resources/resources.module#ResourcesModule'
      }
    ])
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    CustomReuseStrategy,
    { provide: KustoTelemetryService, useExisting: PortalKustoTelemetryService },
    { provide: RouteReuseStrategy, useExisting: CustomReuseStrategy },
    { provide: DiagnosticService, useExisting: GenericApiService },
    { provide: CommsService, useExisting: GenericCommsService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
