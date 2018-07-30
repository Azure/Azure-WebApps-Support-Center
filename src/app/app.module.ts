import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, RouteReuseStrategy } from '@angular/router';

import { SharedModule } from './shared/shared.module';
import { SupportBotModule } from './supportbot/supportbot.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppComponent } from './app.component';
import { CustomReuseStrategy } from './app-route-reusestrategy.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedV2Module } from './shared-v2/shared-v2.module';
import { StartupModule } from './startup/startup.module';
import { DiagnosticDataModule, PUBLIC_CONFIGURATION, DiagnosticService } from 'applens-diagnostics';
import { GenericApiService } from './shared/services/generic-api.service';

@NgModule({
  imports: [
    BrowserModule,
    StartupModule.forRoot(),
    SharedV2Module.forRoot(),
    SupportBotModule,
    AvailabilityModule,
    SharedModule.forRoot(),
    DiagnosticDataModule.forRoot(PUBLIC_CONFIGURATION),
    BrowserAnimationsModule,
    RouterModule.forRoot([
      { 
        path: '', 
        component: AppComponent 
      },
      // {
      //   path: 'old', 
      //   loadChildren: 'app/supportbot/supportbot.module#SupportBotModule'
      // },
      {
        path: 'new/subscriptions/:subscriptionId/resourcegroups/:resourceGroup/providers/microsoft.web/sites/:resourceName',
        // data: {
        //   navigationTitle: 'Home',
        // },
        loadChildren: 'app/resources/web-sites/web-sites.module#WebSitesModule'
      },
      {
        path: 'new/subscriptions/:subscriptionId/resourcegroups/:resourceGroup/providers/microsoft.web/hostingenvironment/:resourceName',
        data: {
          provider: 'Microsoft.Web'
        },
        loadChildren: 'app/resources/web-hosting-environments/web-hosting-environments.module#WebHostingEnvironmentsModule'
      }
    ])//, { enableTracing: true })//
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    { provide: DiagnosticService, useExisting: GenericApiService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }