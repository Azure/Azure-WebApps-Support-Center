import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { WindowService } from './services/window.service';
import { PortalService } from './services/portal.service';
import { BroadcastService } from './services/broadcast.service';
import { AuthService } from './services/auth.service';

@NgModule({
  imports: [
    HttpModule,
    CommonModule
  ],
  declarations: []
})
export class StartupModule { 
  static forRoot(): ModuleWithProviders {
    return {
        ngModule: StartupModule,
        providers: [
            WindowService,
            PortalService,
            BroadcastService,
            AuthService
        ]
    }
}
}
