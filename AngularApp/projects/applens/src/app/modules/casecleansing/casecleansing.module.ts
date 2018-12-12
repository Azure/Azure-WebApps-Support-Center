import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaseCleansingComponent } from './casecleansing/casecleansing.component';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { RouterModule } from '@angular/router';
import { NgxSmartModalModule } from 'ngx-smart-modal';
import { ReactiveFormsModule } from '@angular/forms';

export const CaseCleansingModuleRoutes : ModuleWithProviders = RouterModule.forChild([
  {
    path: '',
    component: CaseCleansingComponent
  }
]);

@NgModule({
  imports: [
    CommonModule,
    CaseCleansingModuleRoutes,
    ReactiveFormsModule,
    NgxSmartModalModule.forRoot()
  ],
  declarations: [CaseCleansingComponent]
})
export class CasecleansingModule { }
