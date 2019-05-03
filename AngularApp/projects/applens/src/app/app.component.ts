import { Component } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private _adalService: AdalService) {
    this._adalService.init({
      clientId: environment.adal.clientId,
      popUp: window.parent !== window,
      redirectUri: `${window.location.origin}`,
      postLogoutRedirectUri: `${window.location.origin}/login`,
      cacheLocation: 'localStorage'
    });
  }
}
