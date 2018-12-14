import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// import { DiagnosticDataModule, PUBLIC_CONFIGURATION, DiagnosticService, CommsService } from 'diagnostic-data';
import { GenericApiService } from '../shared/services/generic-api.service';
import { GenericCommsService } from '../shared/services/generic-comms.service';

const ResourceRoutes = RouterModule.forChild([
  // {
  //   path: 'legacy/subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:sitename',
  //   loadChildren: 'app/availability/availability.module#AvailabilityModule'
  // },
  // {
  //   path: 'legacy/subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:sitename/slots/:slot',
  //   loadChildren: 'app/availability/availability.module#AvailabilityModule'
  // },

  // Web Apps
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:resourcename',
    loadChildren: './web-sites/web-sites.module#WebSitesModule'
  },
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:resourcename/slots/:slot',
    loadChildren: './web-sites/web-sites.module#WebSitesModule'
  },

  // App Service Environment
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/hostingenvironments/:resourcename',
    loadChildren: './web-hosting-environments/web-hosting-environments.module#WebHostingEnvironmentsModule'
  }

]);

@NgModule({
  imports: [
    CommonModule,
    ResourceRoutes
  ],
  declarations: [],
  providers: [
    // { provide: DiagnosticService, useExisting: GenericApiService },
    // { provide: CommsService, useExisting: GenericCommsService }
  ]
})
export class ResourcesModule { }
