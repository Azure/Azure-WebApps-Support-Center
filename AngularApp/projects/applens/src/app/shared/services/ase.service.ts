
import {map, mergeMap} from 'rxjs/operators';
import { Injectable, Inject } from '@angular/core';
import { ResourceService } from './resource.service';
import { ObserverService } from './observer.service';
import { ObserverAseInfo, ObserverAseResponse } from '../models/observer';
import { BehaviorSubject, Observable } from 'rxjs';
import { RESOURCE_SERVICE_INPUTS, ResourceServiceInputs } from '../models/resources';

@Injectable()
export class AseService extends ResourceService {

  private _currentResource: BehaviorSubject<ObserverAseInfo> = new BehaviorSubject(null);

  private _hostingEnvironmentResource: ObserverAseInfo;

  constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs, protected _observerApiService: ObserverService) {
    super(inputs);
  }

  public startInitializationObservable() {
    this._initialized = this._observerApiService.getAse(this._armResource.resourceName).pipe(
      mergeMap((observerResponse: ObserverAseResponse) => {
        this._hostingEnvironmentResource = observerResponse.details;
        this._currentResource.next(observerResponse.details);
        return this._observerApiService.getAseRequestBody(this._hostingEnvironmentResource.Name);
      }),map((requestBody: any) => {
        this._requestBody = requestBody.details;
        return true;
      }),);
  }

  public getCurrentResource(): Observable<ObserverAseInfo> {
    return this._currentResource;
  }
}
