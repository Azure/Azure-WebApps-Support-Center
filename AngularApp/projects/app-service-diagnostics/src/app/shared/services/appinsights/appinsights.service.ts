import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { StartupInfo, ResourceType } from '../../models/portal';
import { Verbs } from '../../models/portal';
import { AuthService } from '../../../startup/services/auth.service';
import { ArmService } from '../arm.service';
import { SiteService } from '../site.service';
import { AppAnalysisService } from '../appanalysis.service';
import { PortalService } from '../../../startup/services/portal.service';
import { PortalActionService } from '../portal-action.service';
import { AvailabilityLoggingService } from '../logging/availability.logging.service';
import { tap, map } from 'rxjs/operators';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';

@Injectable()
export class AppInsightsService {

    private appInsightsExtension = 'AppInsightsExtension';
    private appInsights_KeyStr: string = 'WEBAPP_SUPPORTCNTR_READONLYKEY';
    private appInsightsApiEndpoint: string = 'https://api.applicationinsights.io/v1/apps/';

    public appId_AppSettingStr: string = 'SUPPORTCNTR_APPINSIGHTS_APPID';
    public appKey_AppSettingStr: string = 'SUPPORTCNTR_APPINSIGHTS_APPKEY';
    public resourceUri_AppSettingStr: string = 'SUPPORTCNTR_APPINSIGHTS_URI';

    public loadAppInsightsResourceObservable: BehaviorSubject<boolean>;
    public loadAppDiagnosticPropertiesObservable: BehaviorSubject<boolean>;
    public applicationInsightsValidForApp: BehaviorSubject<boolean>;

    public appInsightsSettings: any = {
        validForStack: undefined,
        enabledForWebApp: undefined,
        connectedWithSupportCenter: undefined,
        resourceUri: undefined,
        name: undefined,
        appId: undefined
    };

    constructor(private http: Http, private authService: AuthService, private armService: ArmService, private siteService: SiteService, private appAnalysisService: AppAnalysisService, private portalService: PortalService, private portalActionService: PortalActionService, private logger: AvailabilityLoggingService, private _telmetryService:TelemetryService) {

        this.loadAppInsightsResourceObservable = new BehaviorSubject<boolean>(null);
        this.loadAppDiagnosticPropertiesObservable = new BehaviorSubject<boolean>(null);
        this.applicationInsightsValidForApp = new BehaviorSubject<boolean>(null);

        this.authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
            if (startupInfo.resourceType === ResourceType.Site) {
                this.postCommandToGetAIResource(startupInfo.resourceId);

                const resourceUriParts = siteService.parseResourceUri(startupInfo.resourceId);
                this.loadAppInsightsSettings(resourceUriParts.subscriptionId, resourceUriParts.resourceGroup, resourceUriParts.siteName, resourceUriParts.slotName);
            }
        });
    }

    private loadAppInsightsSettings(subscription: string, resourceGroup: string, siteName: string, slotName: string = ''): void {

        // Check the stack of the web app to determine whether App Insights can be shown as an option
        this.appAnalysisService.getDiagnosticProperties(subscription, resourceGroup, siteName, slotName).subscribe(data => {

            if (data && data.appStack && data.appStack.toLowerCase().indexOf('asp.net') > -1) {
                this.appInsightsSettings.validForStack = true;
            } else {
                // Sometimes stack comes back unknown for site, even though it is valid
                // Allow for this to set to false only if below subscribe has not already set it valid
                if (this.appInsightsSettings.validForStack === undefined) {
                    this.appInsightsSettings.validForStack = false;
                    this.applicationInsightsValidForApp.next(this.appInsightsSettings.validForStack);
                }
            }

            this.loadAppDiagnosticPropertiesObservable.next(true);
        });

        // Check if App insights is already enabled for the web app.
        this.portalService.getAppInsightsResourceInfo().subscribe((aiResource: string) => {
            if (aiResource && aiResource !== '') {
                this.appInsightsSettings.validForStack = true;
                this.appInsightsSettings.enabledForWebApp = true;
                this.appInsightsSettings.resourceUri = aiResource;

                this.applicationInsightsValidForApp.next(this.appInsightsSettings.validForStack);

                // Do a get on the resource to fill the app id and name.
                this.armService.getResourceWithoutEnvelope(aiResource, '2015-05-01').subscribe((armResponse: any) => {
                    if (armResponse && armResponse.properties) {
                        if (this.isNotNullOrEmpty(armResponse.properties['AppId'])) {
                            this.appInsightsSettings.appId = armResponse.properties['AppId'];
                        }

                        if (this.isNotNullOrEmpty(armResponse.properties['Name'])) {
                            this.appInsightsSettings.name = armResponse.properties['Name'];
                        }
                    }
                    this.loadAppInsightsResourceObservable.next(true);
                });
            } else {
                this.appInsightsSettings.enabledForWebApp = false;
                this.loadAppInsightsResourceObservable.next(false);
            }

            this.logger.LogAppInsightsSettings(this.appInsightsSettings.enabledForWebApp);
        });
    }

    private postCommandToGetAIResource(resouceUri: string) {

        this.portalService.postMessage(Verbs.getAppInsightsResource, JSON.stringify({
            resourceUri: resouceUri
        }));
    }

    CheckIfAppInsightsEnabled(): Observable<boolean> {
        let appInsightsEnabled: boolean = false;
        return this.portalService.getAppInsightsResourceInfo().pipe(
            map((aiResource: string) => {
                appInsightsEnabled = this.isNotNullOrEmpty(aiResource);
                return this.isNotNullOrEmpty(aiResource);
            }));
    }

    DeleteAppInsightsAccessKeyIfExists(): Observable<any> {

        const url = `${this.armService.armUrl}${this.appInsightsSettings.resourceUri}/ApiKeys?api-version=2015-05-01`;
        return this.http.get(url).pipe(tap((data: any) => {
            if (data && data.length && data.length > 0) {

                data.forEach(element => {
                    if (element['name'].toLowerCase() === this.appInsights_KeyStr.toLowerCase()) {

                        this.http.delete(`${this.armService.armUrl}${element['id']}?api-version=2015-05-01`);
                    }
                });
            }
        }));
    }

    GenerateAppInsightsAccessKey(): Observable<any> {
        const url = `${this.appInsightsSettings.resourceUri}/ApiKeys`;
        const body: any = {
            name: this.appInsights_KeyStr,
            linkedReadProperties: [`${this.appInsightsSettings.resourceUri}/api`],
            linkedWriteProperties: []
        };

        return this.armService.postResourceWithoutEnvelope<any, any>(url, body, '2015-05-01');
    }

    ExecuteQuery(query: string): Observable<any> {
        if (!this.isNotNullOrEmpty(query)) {
            return of([]);
        }

        const resourceUri: string = `${this.appInsightsSettings.resourceUri}/api/query?query=${encodeURIComponent(query)}`;
        return this.armService.getResource<any>(resourceUri, '2015-05-01');
    }

    ExecuteQuerywithPostMethod(query: string): Observable<any> {
        if (!this.isNotNullOrEmpty(query)) {
            return of([]);
        }

        const resourceUri: string = `${this.appInsightsSettings.resourceUri}/api/query`;
        const body: any = {
            query: query
        }

        return this.armService.postResource<any, any>(resourceUri, body, '2015-05-01', true, true);
    }

    public openAppInsightsBlade() {
        this.portalActionService.openAppInsightsBlade();
    }

    public openAppInsightsFailuresBlade() {
        this.portalActionService.openAppInsightsFailuresBlade(this.appInsightsSettings.resourceUri);
    }

    public openAppInsightsPerformanceBlade() {
        this.portalActionService.openAppInsightsPerformanceBlade(this.appInsightsSettings.resouceUri);
    }

    public openAppInsightsExtensionBlade(detailBlade?: string) {
        return this.portalService.getAppInsightsResourceInfo().subscribe(
            (aiResource: string) => {
                this.portalActionService.openAppInsightsExtensionBlade(detailBlade, aiResource);
            });
    }

    private isNotNullOrEmpty(item: any): boolean {
        return (item != undefined && item != '');
    }

    public logAppInsightsConnectionError(resourceUri: string, error: any) {
        this._telmetryService.logEvent(TelemetryEventNames.AppInsightsConnectionError, {
            'resourceUri' : resourceUri,
            'error':error
        });
    }

    public logAppInsightsConnected(resourceUri:string) {
        this._telmetryService.logEvent(TelemetryEventNames.AppInsightsConnected,
            {
                'resouceUri' : resourceUri
            });
        }
}
