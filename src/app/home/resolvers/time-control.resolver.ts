import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Injectable } from "@angular/core";
import { DetectorControlService } from "applens-diagnostics";
import { Observable } from "rxjs/Observable";

@Injectable()
export class TimeControlResolver implements Resolve<Observable<boolean>>{
    constructor(private _detectorControlService: DetectorControlService) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        //TODO: This is not working for some reason
        if (!this._detectorControlService.duration) {

            this._detectorControlService.setDefault();
        }
        return Observable.of(true);
    }
}