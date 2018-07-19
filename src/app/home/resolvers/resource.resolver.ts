import { Resolve, ActivatedRouteSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";
import { ResourceService } from "../../shared-v2/services/resource.service";
import { ArmResource } from "../../shared-v2/models/arm";

@Injectable()
export class ResourceResolver implements Resolve<Observable<{} | ArmResource>>{
    constructor(private _resourceService: ResourceService) { }

    resolve(activatedRouteSnapshot: ActivatedRouteSnapshot): Observable<{} | ArmResource> {
       return this._resourceService.registerResource(activatedRouteSnapshot.parent.url.filter(x => x.path !== 'new').join('/'));
    }
}