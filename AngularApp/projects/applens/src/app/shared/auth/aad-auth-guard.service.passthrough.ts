import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable()
export class AadAuthGuard implements CanActivate {
    public isTemporaryAccess: Boolean = false;
    public temporaryAccessExpiryDays: number = 0;

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
        return true;
    }
}
