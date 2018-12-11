
import {map} from 'rxjs/operators';
import { Injectable } from "@angular/core";
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from "@angular/router";
import { GenericApiService } from "../services/generic-api.service";
import { Observable, of } from "rxjs";

@Injectable()
export class TabTitleResolver implements Resolve<Observable<string>>{
  constructor(private _genericApiService: GenericApiService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<string> {
    if (!route.data['navigationTitle']) {
        let detectorId = route.params['detectorName'];
        return this._genericApiService.getDetectors().pipe(map(detectors => {
          return this._genericApiService.getDetectorById(detectorId).name;
        }))
    }
    
    return of('Tab');
  }
}