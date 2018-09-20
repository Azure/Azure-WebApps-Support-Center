import { Component, OnInit, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { INavigationItem } from "./shared/models/inavigationitem";
import { AuthService } from './startup/services/auth.service';
import { WindowService } from './startup/services/window.service';
import { StartupInfo } from './shared/models/portal';
import 'rxjs/add/operator/filter';
import { environment } from '../environments/environment';

@Component({
    selector: 'sc-app',
    templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {

    private _newVersionEnabled = true;

    public get newVersionEnabled() { return this._newVersionEnabled; }

    public set newVersionEnabled(value: boolean) { 
        this._newVersionEnabled = value;
     }

    constructor(private _authService: AuthService, private _router: Router) {
    }

    ngOnInit() {

        if (isDevMode()) {
            console.log('%c Support Center is running in dev mode', 'color: orange')
            console.log('%c Logs that are normally published to the portal kusto logs will show up in the console', 'color: orange')
        }

        if (this._authService.inIFrame || this._authService.hasLocalStartupInfo) {
            this._router.navigate(['/resourceRedirect']);
        }
        else {
            this._router.navigate(['/test']);
        }
    }
}