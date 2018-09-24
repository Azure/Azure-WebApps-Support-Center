import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, RouteReuseStrategy } from '@angular/router';

import { SharedModule } from './shared/shared.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppComponent } from './app.component';
import { CustomReuseStrategy } from './app-route-reusestrategy.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StartupModule } from './startup/startup.module';
import { DiagnosticDataModule, PUBLIC_CONFIGURATION, DiagnosticService } from 'applens-diagnostics';
import { GenericApiService } from './shared/services/generic-api.service';
import { TestInputComponent } from './shared/components/test-input/test-input.component';
import { ResourceRedirectComponent } from './shared/components/resource-redirect/resource-redirect.component';
import { LegacyHomeModule } from './legacy-home/legacy-home.module';

@NgModule({
  imports: [
    BrowserModule,
    StartupModule.forRoot(),
    LegacyHomeModule,
    AvailabilityModule,
    SharedModule.forRoot(),
    DiagnosticDataModule.forRoot(PUBLIC_CONFIGURATION),
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
        path: 'legacy/subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:sitename',
        loadChildren: 'app/availability/availability.module#AvailabilityModule'
      },
      {
        path: 'legacy/subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:sitename/slots/:slot',
        loadChildren: 'app/availability/availability.module#AvailabilityModule'
      },
      {
        path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:resourcename',
        loadChildren: 'app/resources/web-sites/web-sites.module#WebSitesModule'
      },
      {
        path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:resourcename/slots/:slot',
        loadChildren: 'app/resources/web-sites/web-sites.module#WebSitesModule'
      },
      {
        path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/hostingenvironments/:resourcename',
        loadChildren: 'app/resources/web-hosting-environments/web-hosting-environments.module#WebHostingEnvironmentsModule'
      }
      
    ])
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    CustomReuseStrategy,
    { provide: RouteReuseStrategy, useExisting: CustomReuseStrategy },
    { provide: DiagnosticService, useExisting: GenericApiService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }