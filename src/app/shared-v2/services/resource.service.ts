import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { ArmResource } from '../models/arm';
import { ArmService } from '../../shared/services/arm.service';

@Injectable()
export class ResourceService {

  resource: ArmResource;
  error: any;

  constructor(private _armService: ArmService) {

  }
  
  registerResource(resourceUri: string): Observable<{} | ArmResource> {
    console.log(resourceUri);
    return this._armService.getArmResource<ArmResource>(resourceUri)
      .map(resource => {
        console.log(resource);
        this.resource = resource;
        return resource;
      });
  }
}
