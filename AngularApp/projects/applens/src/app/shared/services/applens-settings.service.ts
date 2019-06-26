import { Injectable } from '@angular/core';
import { Observable, pipe} from 'rxjs';
import { ResourceService} from '../../shared/services/resource.service';
@Injectable({
  providedIn: 'root'
})
export class ApplensSettingsService {

  constructor(protected resourceService: ResourceService) { }

  public getUrlToNavigate(): string {
    return null;
   }

   public getScanEnabled(): Observable<boolean>  {
       return null;
   }

   public getResourceUri(): string {
       return this.resourceService.getCurrentResourceId();
   }
}
