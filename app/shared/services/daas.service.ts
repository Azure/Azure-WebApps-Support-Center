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
import { Session } from '../models/idaassession';

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


    getDaasSessions(subscriptionId: string, resourceGroup: string, siteName: string): Observable<Session[]> {      
        let resourceUri: string = this._uriElementsService.getAllDiagnosticsSessionsUrl(subscriptionId, resourceGroup, siteName);
        return this._armClient.getResource<any>(resourceUri);
    }

    submitDaasSession(subscriptionId: string, resourceGroup: string, siteName:string, slot: string = ''): Observable<string> {
        var session = {
            RunLive: true,
            CollectLogsOnly: false,
            StartTime: "",
            TimeSpan: "00:02:00",
            Diagnosers: ["CLR Profiler"],
            Instances: []
        }     

        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsUrl(subscriptionId, resourceGroup, siteName);
        return this._armClient.postResource<any>(resourceUri, session);

    }
    getDaasSessionsWithDetails(subscriptionId: string, resourceGroup: string, siteName: string): Observable<Session[]> {      
        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsDetailsUrl(subscriptionId, resourceGroup, siteName,"all",true);
        return this._armClient.getResource<any>(resourceUri);
    }

    getDaasSessionWithDetails(subscriptionId: string, resourceGroup: string, siteName: string, sessionId:string): Observable<Session> {      
        let resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionUrl(subscriptionId, resourceGroup, siteName,sessionId,true);
        return this._armClient.getResource<any>(resourceUri);
    }



    getInstances(subscriptionId: string, resourceGroup: string, siteName: string) : Observable<string[]> {      
        let resourceUri: string = this._uriElementsService.getDiagnosticsInstancesUrl(subscriptionId, resourceGroup, siteName);
        return this._armClient.getResource<any>(resourceUri);
    }

    startWebJob (subscriptionId: string, resourceGroup: string, siteName: string)
    {
        let resourceUri: string = this._uriElementsService.getDiagnosticsWebJobStartUrl(subscriptionId, resourceGroup, siteName);
        return this._armClient.postResource(resourceUri, null);
    }
    
}