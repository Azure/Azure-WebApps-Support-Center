import { Injectable } from '@angular/core';
import { Http, Headers, Response, Request } from '@angular/http';
import { Observable, ReplaySubject } from 'rxjs/Rx';
import { AuthService, SiteService, AppAnalysisService, ArmService, PortalService } from '../../../shared/services';
import { StartupInfo } from '../../../shared/models/portal';
import { ArmObj } from '../../../shared/models/armObj';
import { Verbs } from '../../../shared/models/portal';
import { Site } from '../../../shared/models/site';

@Injectable()
export class AppInsightsService {

    private appInsightsExtension = "AppInsightsExtension";
    private appInsights_KeyStr: string = "WEBAPP_SUPPORTCNTR_READONLYKEY";
    private appInsightsApiEndpoint: string = "https://api.applicationinsights.io/v1/apps/";

    public appId_AppSettingStr: string = "SUPPORTCNTR_APPINSIGHTS_APPID";
    public appKey_AppSettingStr: string = "SUPPORTCNTR_APPINSIGHTS_APPKEY";
    public resourceUri_AppSettingStr: string = "SUPPORTCNTR_APPINSIGHTS_URI";

    public loadAppInsightsResourceObservable : ReplaySubject<boolean>;
    public loadAppDiagnosticPropertiesObservable : ReplaySubject<boolean>;

    public appInsightsSettings: any = {
        validForStack: undefined,
        enabledForWebApp: undefined,
        connectedWithSupportCenter: undefined,
        resourceUri: undefined,
        name: undefined,
        appId: undefined
    };

    constructor(private http: Http, private authService: AuthService, private armService: ArmService, private siteService: SiteService, private appAnalysisService: AppAnalysisService, private portalService: PortalService) {

        this.loadAppInsightsResourceObservable = new ReplaySubject<boolean>(1);
        this.loadAppDiagnosticPropertiesObservable = new ReplaySubject<boolean>(1);

        this.authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
            this.postCommandToGetAIResource(startupInfo.resourceId);

            let resourceUriParts = siteService.parseResourceUri(startupInfo.resourceId);
            this.loadAppInsightsSettings(resourceUriParts.subscriptionId, resourceUriParts.resourceGroup, resourceUriParts.siteName, resourceUriParts.slotName);

        });
    }

    private loadAppInsightsSettings(subscription: string, resourceGroup: string, siteName: string, slotName: string = ''): void {

        // Check the stack of the web app to determine whether App Insights can be shown as an option
        this.appAnalysisService.getDiagnosticProperties(subscription, resourceGroup, siteName, slotName).subscribe(data => {

            if (!data)   // new app
            {
                this.appInsightsSettings.validForStack = true;
            }
            else if (data.appStack && data.appStack.toLowerCase().indexOf('asp.net') > -1) {
                this.appInsightsSettings.validForStack = true;
            }
            else {
                this.appInsightsSettings.validForStack = false;
            }

            this.loadAppDiagnosticPropertiesObservable.next(true);
        });

        // Check if App insights is already enabled for the web app.
        this.portalService.getAppInsightsResourceInfo().subscribe((aiResource: string) => {
            if (aiResource && aiResource !== '') {
                this.appInsightsSettings.enabledForWebApp = true;
                this.appInsightsSettings.resourceUri = aiResource;

                // Do a get on the resource to fill the app id and name.
                this.armService.getResourceWithoutEnvelope(aiResource, '2015-05-01').subscribe((armResponse: any) => {
                    this.loadAppInsightsResourceObservable.next(true);
                    if (armResponse && armResponse.properties) {
                        if (this.isNotNullOrEmpty(armResponse.properties["AppId"])) {
                            this.appInsightsSettings.appId = armResponse.properties["AppId"];
                        }

                        if (this.isNotNullOrEmpty(armResponse.properties["Name"])) {
                            this.appInsightsSettings.name = armResponse.properties["Name"];
                        }
                    }
                });
            }
            else {
                this.appInsightsSettings.enabledForWebApp = false;
            }
        });

        // Check if App Insights is connected to Support Center.
        /*this.siteService.getSiteAppSettings(subscription, resourceGroup, siteName, slotName)
            .subscribe(data => {
                if (data && data.properties && this.isNotNullOrEmpty(data.properties[this.appId_AppSettingStr]) && this.isNotNullOrEmpty(data.properties[this.appKey_AppSettingStr]) && this.isNotNullOrEmpty(data.properties[this.resourceUri_AppSettingStr])) {
 
                    this.appInsightsSettings.connectedWithSupportCenter = true;
                    // TODO : To make the check more robust, we can make a ping call to the resource to identify whether the key is valid or not.
                }
                else {
                    this.appInsightsSettings.connectedWithSupportCenter = false;
                }
            });*/
    }

    private postCommandToGetAIResource(resouceUri: string) {

        this.portalService.postMessage(Verbs.getAppInsightsResource, JSON.stringify({
            resourceUri: resouceUri
        }));
    }

    DeleteAppInsightsAccessKeyIfExists(): Observable<any> {

        let url: string = `${this.armService.armUrl}${this.appInsightsSettings.resourceUri}/ApiKeys?api-version=2015-05-01`;
        return this.http.get(url).do((data: any) => {
            if (data && data.length && data.length > 0) {

                data.forEach(element => {
                    if (element["name"].toLowerCase() === this.appInsights_KeyStr.toLowerCase()) {

                        this.http.delete(`${this.armService.armUrl}${element["id"]}?api-version=2015-05-01`);
                    }
                });
            }
        });
    }

    GenerateAppInsightsAccessKey(): Observable<any> {

        let url: string = `${this.appInsightsSettings.resourceUri}/ApiKeys`;
        let body: any = {
            name: this.appInsights_KeyStr,
            linkedReadProperties: [`${this.appInsightsSettings.resourceUri}/api`],
            linkedWriteProperties: []
        };

        return this.armService.postResourceWithoutEnvelope<any, any>(url, body, '2015-05-01');
    }

    ExecuteQuery(query: string): Observable<any> {
        if (!this.isNotNullOrEmpty(query)) {
            return Observable.from([]);
        }

        let resourceUri: string = `${this.appInsightsSettings.resourceUri}/api/query?query=${encodeURIComponent(query)}`;
        return this.armService.getResource<any>(resourceUri, '2015-05-01');
    }

    private isNotNullOrEmpty(item: any): boolean {
        return (item && item != '');
    }
}