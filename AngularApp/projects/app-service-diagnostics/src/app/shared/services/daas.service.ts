
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs'
import { SiteDaasInfo } from '../models/solution-metadata';
import { ArmService } from './arm.service';
import { AuthService } from '../../startup/services/auth.service';
import { UriElementsService } from './urielements.service';
import { Session, DiagnoserDefinition, DatabaseTestConnectionResult } from '../models/daas';
import { SiteInfoMetaData } from '../models/site';

@Injectable()
export class DaasService {

    public currentSite: SiteDaasInfo;

    constructor(private _armClient: ArmService, private _authService: AuthService, private _http: Http, private _uriElementsService: UriElementsService) {
    }

    getDaasSessions(site: SiteDaasInfo): Observable<Session[]> {
        let resourceUri: string = this._uriElementsService.getAllDiagnosticsSessionsUrl(site);
        return <Observable<Session[]>>(this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true));
    }

    submitDaasSession(site: SiteDaasInfo, diagnoser: string, Instances: string[]): Observable<string> {

        let session = new Session();
        session.CollectLogsOnly = false;
        session.StartTime = "";
        session.RunLive = true;
        session.Instances = Instances;
        session.Diagnosers = [];
        session.Diagnosers.push(diagnoser);
        session.TimeSpan = "00:02:00";

        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsUrl(site);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session, null, true));
    }
    
    cancelDaasSession(site: SiteDaasInfo, sessionId: string): Observable<boolean> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionUrl(site, sessionId, "cancel");
        return <Observable<boolean>>(this._armClient.postResource(resourceUri, null, null, true));
    }

    getDaasSessionsWithDetails(site: SiteDaasInfo): Observable<Session[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsDetailsUrl(site, "all", true);
        return <Observable<Session[]>>this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true);
    }

    getDaasActiveSessionsWithDetails(site: SiteDaasInfo): Observable<Session[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsDetailsUrl(site, "active", true);
        return <Observable<Session[]>>this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true);
    }

    getDaasSessionWithDetails(site: SiteDaasInfo, sessionId: string): Observable<Session> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionUrl(site, sessionId, true);
        return <Observable<Session>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri, null, true);
    }

    getInstances(site: SiteDaasInfo): Observable<string[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsInstancesUrl(site);
        return <Observable<string[]>>this._armClient.getResourceWithoutEnvelope<string[]>(resourceUri, null, true);
    }

    getDiagnosers(site: SiteDaasInfo): Observable<DiagnoserDefinition[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsDiagnosersUrl(site);
        return <Observable<DiagnoserDefinition[]>>this._armClient.getResourceWithoutEnvelope<DiagnoserDefinition[]>(resourceUri, null, true);
    }

    getDatabaseTest(site: SiteInfoMetaData): Observable<DatabaseTestConnectionResult[]> {
        let resourceUri: string = this._uriElementsService.getDatabaseTestUrl(site);
        return <Observable<DatabaseTestConnectionResult[]>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri, null, true);
    }

    getDaasWebjobState(site: SiteDaasInfo): Observable<string> {
        let resourceUri: string = this._uriElementsService.getWebJobs(site);
        return this._armClient.getResourceCollection<any>(resourceUri, null, true).pipe(map(response => {
            if (Array.isArray(response) && response.length > 0) {
                let daasWebJob = response.filter(x => x.id.toLowerCase().endsWith("/daas"));
                if (daasWebJob != null && daasWebJob.length > 0 && daasWebJob[0].properties != null) {
                    return daasWebJob[0].properties.status;
                }
                else {
                    return "";
                }
            }
        }
        ));
    }

    deleteDaasSession(site: SiteDaasInfo, sessionId: string): Observable<any> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionDeleteUrl(site, sessionId);
        return <Observable<any>>(this._armClient.deleteResource(resourceUri, null, true));
    }

    private _getHeaders(): Headers {

        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');
        headers.append('Authorization', `Bearer ${this._authService.getAuthToken()}`);

        return headers;
    }
}