
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs';
import { SiteDaasInfo } from '../models/solution-metadata';
import { ArmService } from './arm.service';
import { AuthService } from '../../startup/services/auth.service';
import { UriElementsService } from './urielements.service';
import { Session, DiagnoserDefinition, DatabaseTestConnectionResult, MonitoringSession, MonitoringLogsPerInstance, ActiveMonitoringSession, DaasAppInfo, DaasSettings } from '../models/daas';
import { SiteInfoMetaData } from '../models/site';

const BlobContainerName: string = "memorydumps";

@Injectable()
export class DaasService {

    public currentSite: SiteDaasInfo;
    constructor(private _armClient: ArmService, private _authService: AuthService, private _http: Http, private _uriElementsService: UriElementsService) {
    }

    getDaasSessions(site: SiteDaasInfo): Observable<Session[]> {
        const resourceUri: string = this._uriElementsService.getAllDiagnosticsSessionsUrl(site);
        return <Observable<Session[]>>(this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true));
    }

    submitDaasSession(site: SiteDaasInfo, diagnoser: string, Instances: string[], collectLogsOnly: boolean, blobSasUri: string): Observable<string> {

        const session = new Session();
        session.CollectLogsOnly = collectLogsOnly;
        session.StartTime = '';
        session.RunLive = true;
        session.Instances = Instances;
        session.Diagnosers = [];
        session.Diagnosers.push(diagnoser);
        session.TimeSpan = '00:02:00';
        session.BlobSasUri = blobSasUri;

        const resourceUri: string = this._uriElementsService.getDiagnosticsSessionsUrl(site);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session, null, true));
    }

    cancelDaasSession(site: SiteDaasInfo, sessionId: string): Observable<boolean> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionUrl(site, sessionId, 'cancel');
        return <Observable<boolean>>(this._armClient.postResource(resourceUri, null, null, true));
    }

    getDaasSessionsWithDetails(site: SiteDaasInfo): Observable<Session[]> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSessionsDetailsUrl(site, 'all', true);
        return <Observable<Session[]>>this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true);
    }

    getDaasActiveSessionsWithDetails(site: SiteDaasInfo): Observable<Session[]> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSessionsDetailsUrl(site, 'active', true);
        return <Observable<Session[]>>this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true);
    }

    getDaasSessionWithDetails(site: SiteDaasInfo, sessionId: string): Observable<Session> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionUrl(site, sessionId, true);
        return <Observable<Session>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri, null, true);
    }

    getInstances(site: SiteDaasInfo): Observable<string[]> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsInstancesUrl(site);
        return <Observable<string[]>>this._armClient.getResourceWithoutEnvelope<string[]>(resourceUri, null, true);
    }

    getDiagnosers(site: SiteDaasInfo): Observable<DiagnoserDefinition[]> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsDiagnosersUrl(site);
        return <Observable<DiagnoserDefinition[]>>this._armClient.getResourceWithoutEnvelope<DiagnoserDefinition[]>(resourceUri, null, true);
    }

    getDatabaseTest(site: SiteInfoMetaData): Observable<DatabaseTestConnectionResult[]> {
        const resourceUri: string = this._uriElementsService.getDatabaseTestUrl(site);
        return <Observable<DatabaseTestConnectionResult[]>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri, null, true);
    }

    getDaasWebjobState(site: SiteDaasInfo): Observable<string> {
        const resourceUri: string = this._uriElementsService.getWebJobs(site);
        return this._armClient.getResourceCollection<any>(resourceUri, null, true).pipe(map(response => {
            if (Array.isArray(response) && response.length > 0) {
                const daasWebJob = response.filter(x => x.id.toLowerCase().endsWith('/daas'));
                if (daasWebJob != null && daasWebJob.length > 0 && daasWebJob[0].properties != null) {
                    return daasWebJob[0].properties.status;
                } else {
                    return '';
                }
            }
        }
        ));
    }

    deleteDaasSession(site: SiteDaasInfo, sessionId: string): Observable<any> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionDeleteUrl(site, sessionId);
        return <Observable<any>>(this._armClient.deleteResource(resourceUri, null, true));
    }

    getAppInfo(site: SiteDaasInfo): Observable<DaasAppInfo> {
        const resourceUri: string = this._uriElementsService.getAppInfoUrl(site);
        return <Observable<DaasAppInfo>>(this._armClient.getResourceWithoutEnvelope<DaasAppInfo>(resourceUri, null, true));
    }

    getAllMonitoringSessions(site: SiteDaasInfo): Observable<MonitoringSession[]> {
        const resourceUri: string = this._uriElementsService.getMonitoringSessionsUrl(site);
        return <Observable<MonitoringSession[]>>(this._armClient.getResourceWithoutEnvelope<MonitoringSession[]>(resourceUri, null, true));
    }

    getMonitoringSession(site: SiteDaasInfo, sessionId: string): Observable<MonitoringSession> {
        const resourceUri: string = this._uriElementsService.getMonitoringSessionUrl(site, sessionId);
        return <Observable<MonitoringSession>>(this._armClient.getResourceWithoutEnvelope<MonitoringSession>(resourceUri, null, true));
    }
    analyzeMonitoringSession(site: SiteDaasInfo, sessionId: string): Observable<any> {
        const resourceUri: string = this._uriElementsService.getAnalyzeMonitoringSessionUrl(site, sessionId);
        return <Observable<any>>(this._armClient.postResource(resourceUri, null, null, true));
    }
    getActiveMonitoringSession(site: SiteDaasInfo): Observable<MonitoringSession> {
        const resourceUri: string = this._uriElementsService.getActiveMonitoringSessionUrl(site);
        return <Observable<MonitoringSession>>(this._armClient.getResourceWithoutEnvelope<MonitoringSession>(resourceUri, null, true));
    }
    getActiveMonitoringSessionDetails(site: SiteDaasInfo): Observable<ActiveMonitoringSession> {
        const resourceUri: string = this._uriElementsService.getActiveMonitoringSessionDetailsUrl(site);
        return <Observable<ActiveMonitoringSession>>(this._armClient.getResourceWithoutEnvelope<ActiveMonitoringSession>(resourceUri, null, true));
    }
    stopMonitoringSession(site: SiteDaasInfo): Observable<string> {
        const resourceUri: string = this._uriElementsService.stopMonitoringSessionUrl(site);
        return <Observable<string>>(this._armClient.postResource(resourceUri, null, null, true));
    }

    submitMonitoringSession(site: SiteDaasInfo, session: MonitoringSession): Observable<string> {
        const resourceUri: string = this._uriElementsService.getMonitoringSessionsUrl(site);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session, null, true));
    }

    deleteMonitoringSession(site: SiteDaasInfo, sessionId: string): Observable<string> {
        const resourceUri: string = this._uriElementsService.getMonitoringSessionUrl(site, sessionId);
        return <Observable<string>>(this._armClient.deleteResource(resourceUri, null, true));
    }

    setBlobSasUri(site: SiteDaasInfo, blobAccount: string, blobKey: string): Observable<boolean> {
        const resourceUri: string = this._uriElementsService.getBlobSasUriUrl(site);
        const settings = new DaasSettings();
        settings.BlobSasUri = "";
        settings.BlobContainer = BlobContainerName.toLowerCase();
        settings.BlobKey = blobKey;
        settings.BlobAccount = blobAccount;

        return <Observable<boolean>>(this._armClient.postResource(resourceUri, settings, null, true));
    }

    getBlobSasUri(site: SiteDaasInfo): Observable<DaasSettings> {
        const resourceUri: string = this._uriElementsService.getBlobSasUriUrl(site);
        return <Observable<DaasSettings>>(this._armClient.getResourceWithoutEnvelope<DaasSettings>(resourceUri, null, true));
    }

    private _getHeaders(): Headers {

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');
        headers.append('Authorization', `Bearer ${this._authService.getAuthToken()}`);

        return headers;
    }
}
