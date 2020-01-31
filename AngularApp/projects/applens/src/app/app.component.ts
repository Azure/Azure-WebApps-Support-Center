import { Component } from '@angular/core';
import { AdalService } from 'adal-angular4';
import {AadAuthGuard} from './shared/auth/aad-auth-guard.service';
import { environment } from '../environments/environment';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  env = environment;
  showBanner = true;
  constructor(private _adalService: AdalService, public _authGuardService: AadAuthGuard) {
    if (environment.adal.enabled){
      this._adalService.init({
        clientId: environment.adal.clientId,
        popUp: window.parent !== window,
        redirectUri: `${window.location.origin}`,
        postLogoutRedirectUri: `${window.location.origin}/login`,
        cacheLocation: 'localStorage'
       });
    }
  }

  hideBanner(){
    this.showBanner = false;
  }
}
