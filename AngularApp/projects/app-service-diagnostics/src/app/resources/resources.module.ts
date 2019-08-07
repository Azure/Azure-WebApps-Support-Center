import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

const ResourceRoutes = RouterModule.forChild([

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
  },

  // Generic ARM Resource
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/:providerName/:resourceTypeName/:resourcename',
    loadChildren: './generic-arm-resources/generic-arm-resources.module#GenericArmResourcesModule'
  },

  //Generic ARM Resource with suffix
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/:providerName/:resourceTypeName/:resourcename/:armSuffix',
    loadChildren: './generic-arm-resources/generic-arm-resources.module#GenericArmResourcesModule'
  }

]);

@NgModule({
  imports: [
    CommonModule,
    ResourceRoutes
  ],
  declarations: [],
  providers: []
})
export class ResourcesModule { }
