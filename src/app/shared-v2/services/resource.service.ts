import { Injectable } from '@angular/core';
import { Observable, ReplaySubject} from 'rxjs';
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

  public get searchSuffix(): string  {
    return 'Azure';
  }

  public get loggingMetadata(): Observable<any> {
    return ReplaySubject.of({});
  }
  
  public registerResource(resourceUri: string): Observable<{} | ArmResource> {
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
