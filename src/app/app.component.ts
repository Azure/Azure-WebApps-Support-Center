import { Component, OnInit, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './startup/services/auth.service';

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

    constructor(private _router: Router) {
    }

    ngOnInit() {

        if (isDevMode()) {
            console.log('%c Support Center is running in dev mode', 'color: orange')
            console.log('%c Logs that are normally published to the portal kusto logs will show up in the console', 'color: orange')
        }

        this._router.navigate(['/resourceRedirect']);

        // if (window.parent !== window) {
        //     this._router.navigate(['/resourceRedirect']);
        // }
        // else {
        //     this._router.navigate(['/test']);
        // }
    }
}