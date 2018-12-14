
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArmResource } from '../models/arm';
import { ArmService } from '../../shared/services/arm.service';

@Injectable()
export class ResourceService {

  protected _subscription: string;

  public resource: ArmResource;
  public error: any;

  constructor(protected _armService: ArmService) { }

  private _initialize() {
    const pieces = this.resource.id.toLowerCase().split('/');
    this._subscription = pieces[pieces.indexOf('subscriptions') + 1];
  }

  public get resourceIdForRouting() {
    return this.resource.id.toLowerCase();
  }

  public get searchSuffix(): string {
    return 'Azure';
  }

  public get subscriptionId(): string {
    return this._subscription;
  }

  public get isApplicableForLiveChat(): boolean {
    return false;
  }

  public registerResource(resourceUri: string): Observable<{} | ArmResource> {
    return this._armService.getArmResource<ArmResource>(resourceUri).pipe(
      map(resource => {
        this.resource = resource;
        this._initialize();
        this.makeWarmUpCalls();
        return resource;
      }));
  }



  protected makeWarmUpCalls() {
    //No warm up calls in base
  }
}
