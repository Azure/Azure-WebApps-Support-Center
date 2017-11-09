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
    }

    getDaasSessions(subscriptionId: string, resourceGroup: string, siteName: string): Observable<Session[]> {
        let resourceUri: string = this._uriElementsService.getAllDiagnosticsSessionsUrl(subscriptionId, resourceGroup, siteName);
        return <Observable<Session[]>>(this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri));
    }

    submitDaasSession(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): Observable<string> {

        let session = new Session();
        session.CollectLogsOnly = false;
        session.StartTime = "";
        session.RunLive = true;
        session.Instances = [];
        session.Diagnosers = [];
        session.Diagnosers.push("CLR Profiler");
        session.TimeSpan = "00:02:00";

        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsUrl(subscriptionId, resourceGroup, siteName);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session));
    }
    getDaasSessionsWithDetails(subscriptionId: string, resourceGroup: string, siteName: string): Observable<Session[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsDetailsUrl(subscriptionId, resourceGroup, siteName, "all", true);
        return <Observable<Session[]>>this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri);
    }

    getDaasSessionWithDetails(subscriptionId: string, resourceGroup: string, siteName: string, sessionId: string): Observable<Session> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionUrl(subscriptionId, resourceGroup, siteName, sessionId, true);
        return <Observable<Session>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri);
    }

    getInstances(subscriptionId: string, resourceGroup: string, siteName: string): Observable<string[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsInstancesUrl(subscriptionId, resourceGroup, siteName);
        return <Observable<string[]>>this._armClient.getResourceWithoutEnvelope<string[]>(resourceUri);
    }

    startWebJob(subscriptionId: string, resourceGroup: string, siteName: string) {
        let resourceUri: string = this._uriElementsService.getDiagnosticsWebJobStartUrl(subscriptionId, resourceGroup, siteName);
        return this._armClient.postResource(resourceUri, null);
    }
}