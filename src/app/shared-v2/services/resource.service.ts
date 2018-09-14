import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { ArmResource } from '../models/arm';
import { ArmService } from '../../shared/services/arm.service';

@Injectable()
export class ResourceService {

  public resource: ArmResource;
  public error: any;

  constructor(protected _armService: ArmService) {

  }

  public get resourceIdForRouting() {
    return this.resource.id.toLowerCase();
  }
  
  registerResource(resourceUri: string): Observable<{} | ArmResource> {
    console.log(resourceUri);
    return this._armService.getArmResource<ArmResource>(resourceUri)
      .map(resource => {
        this.resource = resource;
        this.makeWarmUpCalls();
        return resource;
      });
  }

  protected makeWarmUpCalls() {

  }
}
