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
        
        if(this.checkResourceUriMissingApiParam(resourceUri)) {
            return of({});
        }
        
        if (this.checkResourceUriIsEmpty(resourceUri)) {
            const url = state.url;
            const startIndex = url.indexOf("subscriptions/") > -1 ? url.indexOf("subscriptions/") : 0;
            let endIndex = url.length;
            if(url.indexOf('/categories') > -1) {
                endIndex = url.indexOf("/categories");
            }else if (url.indexOf('/supportTopicId') > -1){
                endIndex = url.indexOf('/supportTopicId');
            }
            resourceUri = url.substring(startIndex, endIndex);
        }
        

        return this._resourceService.registerResource(resourceUri);
    }

    private checkResourceUriIsEmpty(resourceUri: string): boolean {
        return resourceUri === "" || resourceUri === "/";
    }

    //All dependencies call from below Uri is returning 400, block ARM call
    private checkResourceUriMissingApiParam(resourceUri: string): boolean {
        const missingApiParamUri = "?clientOptimizations";
        if(resourceUri.startsWith(missingApiParamUri) || resourceUri.startsWith(`/${missingApiParamUri}`)) {
            const error = new Error("MissingApiVersionParameter handled at resolver");
            if(this.telemetryService) {
                this.telemetryService.logEvent(
                    "MissingApiExceptionFromResolver",
                    {
                        "resourceUri" : resourceUri,  
                    }
                );
            }
            return true;
        }
        return false;   
    }
}
