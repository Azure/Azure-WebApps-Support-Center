import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { AutoHealingModule } from '../auto-healing/auto-healing.module';
import { RouterModule } from '@angular/router';
import { DiagnosticToolsRoutes } from './diagnostic-tools.routeconfig';

//TODO: Move all the components for diagnostic tools to this module. For now leaving in shared to avoid a lot of import updates

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    AutoHealingModule,
    RouterModule.forChild(DiagnosticToolsRoutes)
  ],
  declarations: []
})
export class DiagnosticToolsModule { }
