import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AdalService } from "adal-angular4";

const loginRedirectKey = 'login_redirect';

@Injectable()
export class AadAuthGuard implements CanActivate {



    constructor(private _router: Router, private _adalService: AdalService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
        this._adalService.handleWindowCallback();

        if (!this._adalService.userInfo.authenticated) {
            if (state.url.indexOf('#') === -1) {
                localStorage.setItem(loginRedirectKey, state.url);
                this._router.navigate(['login'])
            }
        }
        else {
            this.clearHash();
            var returnUrl = localStorage.getItem(loginRedirectKey);
            if (returnUrl && returnUrl != '') {
                this._router.navigateByUrl(returnUrl);
                localStorage.removeItem(loginRedirectKey);
            }
            return true;
        }
    }

    clearHash() {
        if (window.location.hash) {
            if (window.history.replaceState) {
                window.history.replaceState('', '/', window.location.pathname)
            } else {
                window.location.hash = '';
            }
        }
    }
}