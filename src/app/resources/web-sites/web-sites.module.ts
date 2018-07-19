import { NgModule } from '@angular/core';
import { SharedV2Module } from '../../shared-v2/shared-v2.module';
 import { SharedModule } from '../../shared/shared.module';
import { ResourceService } from '../../shared-v2/services/resource.service';
import { WebSitesService } from '../../shared-v2/services/web-sites.service';
import { ResourceResolver } from '../../home/resolvers/resource.resolver';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

const ResourceRoutes = RouterModule.forChild([
  {
    path: '',
    loadChildren: 'app/home/home.module#HomeModule',
    resolve: { data: ResourceResolver }
  }
]);

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SharedV2Module,
    ResourceRoutes
  ],
  declarations: [],
  providers: [
    { provide: ResourceService, useClass: WebSitesService },
    ResourceResolver
  ]
})
export class WebSitesModule { }