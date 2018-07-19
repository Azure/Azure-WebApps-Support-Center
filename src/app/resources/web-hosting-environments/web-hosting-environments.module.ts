import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedV2Module } from '../../shared-v2/shared-v2.module';
// import { SharedModule } from '../../shared/shared.module';
import { ResourceService } from '../../shared-v2/services/resource.service';
import { WebHostingEnvironmentsService } from '../../shared-v2/services/web-hosting-environments.service';
import { ResourceResolver } from '../../home/resolvers/resource.resolver';
import { RouterModule } from '@angular/router';

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
    SharedV2Module,
    //SharedModule,
    ResourceRoutes
  ],
  declarations: [],
  providers: [
    { provide: ResourceService, useClass: WebHostingEnvironmentsService },
    ResourceResolver
  ]
})
export class WebHostingEnvironmentsModule { }