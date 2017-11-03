import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ArmService, AuthService, UriElementsService, ServerFarmDataService } from '../services';
import { Observable } from 'rxjs/Observable';
import { StartupInfo } from '../models/portal';
import { Site } from '../models/site'

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { SiteProfilingInfo } from '../models/solution-metadata';

@Injectable()
export class DaasService {

    public currentSite: SiteProfilingInfo;

    constructor(private _armClient: ArmService, private _authService: AuthService, private _http: Http, private _uriElementsService: UriElementsService) {
        this._authService.getStartupInfo().flatMap((startUpInfo: StartupInfo) => {
            return this._armClient.getArmResource(startUpInfo.resourceId);
        }).subscribe((site: Site) => {
            var siteInfo = site;
            //this.currentSite.siteName = site.name;
            //this.currentSite.subscriptionId= site.properties.;
            //this.currentSite.resourceGroupName = site.properties.resourceGroup;
        });
    }


    //collectProfilerTrace(subscriptionId: string, resourceGroup: string, siteName: string): Observable<boolean> {      
      //  let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsUrl(subscriptionId, resourceGroup, siteName);
      //  return this._armClient.postResource(resourceUri, null);
  //  }

    getDaasSessions(subscriptionId: string, resourceGroup: string, siteName: string): Observable<boolean> {      
        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsUrl(subscriptionId, resourceGroup, siteName);
        return this._armClient.getResource<any>(resourceUri);
    }

    getInstances(subscriptionId: string, resourceGroup: string, siteName: string) : Observable<boolean> {      
        let resourceUri: string = this._uriElementsService.getDiagnosticsInstancesUrl(subscriptionId, resourceGroup, siteName);
        return this._armClient.getResource<any>(resourceUri);
    }

    startDaasSession(subscriptionId: string, resourceGroup: string, siteName: string)
    {
      //  let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsUrl(subscriptionId, resourceGroup, siteName);

    }

    startWebJob (subscriptionId: string, resourceGroup: string, siteName: string)
    {
        let resourceUri: string = this._uriElementsService.getDiagnosticsWebJobStartUrl(subscriptionId, resourceGroup, siteName);
        return this._armClient.postResource(resourceUri, null);
    }
    
}