import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Injectable } from "@angular/core";
import { DetectorControlService } from "diagnostic-data";
import { Observable, of } from "rxjs";

@Injectable()
export class TimeControlResolver implements Resolve<Observable<boolean>>{
    constructor(private _detectorControlService: DetectorControlService) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        if (!this._detectorControlService.startTime) {

            this._detectorControlService.setDefault();
        }
        return of(true);
    }
}