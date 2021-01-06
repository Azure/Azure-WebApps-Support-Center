import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { ResourceService } from '../../shared-v2/services/resource.service';
import { ArmResource } from '../../shared-v2/models/arm';
import { DetectorControlService, TelemetryService } from 'diagnostic-data';

@Injectable()
export class ResourceResolver implements Resolve<Observable<{} | ArmResource>> {
    constructor(private _resourceService: ResourceService, private _detectorControlService: DetectorControlService,private telemetryService: TelemetryService) { }
    // Live Chat Service is included here so that we ensure an instance is created

    resolve(activatedRouteSnapshot: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{} | ArmResource> {
        if (!this._detectorControlService.startTime) {

            this._detectorControlService.setDefault();
        }

        //Try get resourceUri from activatedRoute,if not then get from Routerstate
        let resourceUri = activatedRouteSnapshot.parent.url
            .filter(x => x.path !== 'new' && x.path !== 'categories')
            .map(x => x.path)
            .join('/');

        //All dependencies call from below Uri is returning 400, block ARM call
        const missingApiParamUri = "management.azure.com/?clientOptimizations=undefined&l=en.en-us&trustedAuthority=https:%2F%2Fportal.azure.com&shellVersion=undefined#";
        if(resourceUri.includes(missingApiParamUri)) {
            const error = new Error("MissingApiVersionParameter handled at resolver");
            this.telemetryService.logException(
                error,
                "resource.resolver",
                {
                    "resourceUri" : resourceUri,  
                }
            );
            return of({});
        }
        
        if (!this.checkResourceUri(resourceUri)) {
            const url = state.url;
            const startIndex = url.indexOf("subscriptions/") > -1 ? url.indexOf("subscriptions/") : 0;
            const endIndex = url.indexOf("/categories") > -1 ? url.indexOf("/categories") : url.length;

            resourceUri = url.substring(startIndex, endIndex);
        }
        

        return this._resourceService.registerResource(resourceUri);
    }

    private checkResourceUri(resourceUri: string): boolean {
        return resourceUri !== "" && resourceUri !== "/";
    }
}
