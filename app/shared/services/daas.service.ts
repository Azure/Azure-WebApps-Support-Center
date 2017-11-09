import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ArmService, AuthService, UriElementsService } from '../services';
import { Observable } from 'rxjs/Observable';
import { SiteProfilingInfo } from '../models/solution-metadata';
import { Session } from '../models/daas';

@Injectable()
export class DaasService {

    public currentSite: SiteProfilingInfo;

    constructor(private _armClient: ArmService, private _authService: AuthService, private _http: Http, private _uriElementsService: UriElementsService) {       
    }

    getDaasSessions(site: SiteProfilingInfo): Observable<Session[]> {
        let resourceUri: string = this._uriElementsService.getAllDiagnosticsSessionsUrl(site);
        return <Observable<Session[]>>(this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri));
    }

    submitDaasSession(site:SiteProfilingInfo): Observable<string> {

        let session = new Session();
        session.CollectLogsOnly = false;
        session.StartTime = "";
        session.RunLive = true;
        session.Instances = [];
        session.Diagnosers = [];
        session.Diagnosers.push("CLR Profiler");
        session.TimeSpan = "00:02:00";

        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsUrl(site);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session));
    }
    getDaasSessionsWithDetails(site:SiteProfilingInfo): Observable<Session[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsDetailsUrl(site, "all", true);
        return <Observable<Session[]>>this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri);
    }

    getDaasSessionWithDetails(site:SiteProfilingInfo, sessionId: string): Observable<Session> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionUrl(site, sessionId, true);
        return <Observable<Session>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri);
    }

    getInstances(site:SiteProfilingInfo): Observable<string[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsInstancesUrl(site);
        return <Observable<string[]>>this._armClient.getResourceWithoutEnvelope<string[]>(resourceUri);
    }

    startWebJob(site:SiteProfilingInfo,) {
        let resourceUri: string = this._uriElementsService.getDiagnosticsWebJobStartUrl(site);
        return this._armClient.postResource(resourceUri, null);
    }
}