import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { StartupInfo, ResourceType, AppType } from '../models/portal';
import { Site, SiteInfoMetaData } from '../models/site';
import { ResponseMessageEnvelope } from '../models/responsemessageenvelope';
import { ArmService } from './arm.service';
import { AuthService } from '../../startup/services/auth.service';
import { UriElementsService } from './urielements.service';
import { ServerFarmDataService } from './server-farm-data.service';
import { SiteDaasInfo } from '../models/solution-metadata';
import { mergeMap ,  map } from 'rxjs/operators';
import { TelemetryService } from '../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';

@Injectable()
export class SiteService {

    public currentSite: BehaviorSubject<Site> = new BehaviorSubject<Site>(null);
    public currentSiteMetaData: BehaviorSubject<SiteInfoMetaData> = new BehaviorSubject<SiteInfoMetaData>(null);

    //TODO: This should be deprecated, but leaving it for now while we move to new solutions
    public currentSiteStatic: Site;

    constructor(private _armClient: ArmService, private _authService: AuthService, private _http: HttpClient,
        private _uriElementsService: UriElementsService, private _serverFarmService: ServerFarmDataService,
        private logService: TelemetryService) {
        this._authService.getStartupInfo().subscribe((startUpInfo: StartupInfo) => {
            this._populateSiteInfo(startUpInfo.resourceId);
            if (startUpInfo.resourceType === ResourceType.Site) {
                this._armClient.getResource<Site>(startUpInfo.resourceId).subscribe((site: ResponseMessageEnvelope<Site>) => {

                    this.currentSiteStatic = site.properties;
                    this.currentSiteStatic.id = site.id;
                    this.currentSiteStatic.tags = site.tags;
                    this.currentSiteStatic.appType = site.kind.toLowerCase().indexOf('functionapp') >= 0 ? AppType.FunctionApp : AppType.WebApp;
                    this.currentSite.next(this.currentSiteStatic);
                });
            }
        });
    }

    // I am making the assumption that two sites on the same server farm must be in the same sub
    // but they don't necessarily have to be in the same resource group
    private findTargetedSite(siteName: string): Observable<Site> {
        siteName = siteName.toLowerCase();
        return this.currentSite.pipe(
            mergeMap(site => {
                if (site.name.toLowerCase() === siteName) {
                    return of<Site>(site);
                }

                return this._serverFarmService.sitesInServerFarm.pipe(map(sitesInServerFarm => {
                    return sitesInServerFarm.find(site => site.name.toLowerCase() === siteName);
                }));
            })
        );
    }

    parseResourceUri(resourceUri: string): any {

        const output = {
            subscriptionId: '',
            resourceGroup: '',
            siteName: '',
            slotName: ''
        };

        if (!resourceUri) {
            return output;
        }

        const resourceUriParts = resourceUri.toLowerCase().split('/');

        const subscriptionIndex = resourceUriParts.indexOf('subscriptions');
        if (subscriptionIndex > -1) {
            output.subscriptionId = resourceUriParts[subscriptionIndex + 1];
        }

        const resourceGroupIndex = resourceUriParts.indexOf('resourcegroups');
        if (resourceGroupIndex > -1) {
            output.resourceGroup = resourceUriParts[resourceGroupIndex + 1];
        }

        const sitesIndex = resourceUriParts.indexOf('sites');
        if (sitesIndex > -1) {
            output.siteName = resourceUriParts[sitesIndex + 1];
        }

        const slotIndex = resourceUriParts.indexOf('slots');
        if (slotIndex > -1) {
            output.slotName = resourceUriParts[slotIndex + 1];
        }

        return output;
    }

    restartSite(subscriptionId: string, resourceGroup: string, siteName: string): Observable<boolean> {
        return this.findTargetedSite(siteName).pipe(mergeMap((targetedSite: Site) => {
            let slotName = '';
            let mainSiteName = targetedSite.name;

            if (targetedSite.name.indexOf('(') >= 0) {
                const parts = targetedSite.name.split('(');
                mainSiteName = parts[0];
                slotName = parts[1].replace(')', '');
            }

            const resourceUri: string = this._uriElementsService.getSiteRestartUrl(subscriptionId, targetedSite.resourceGroup, mainSiteName, slotName);
            return <Observable<boolean>>(this._armClient.postResource(resourceUri, null, null, true));
        }));
    }

    restartSiteFromUri(resourceUri: string): Observable<HttpResponse<any>> {
        const restartUri = this._uriElementsService.getRestartUri(resourceUri);

        let result = this._armClient.postResourceFullResponse(restartUri, null, true);
        result.subscribe(response => {
            this.logService.logEvent('Solution_RestartSite', {
                'status': response.status.toString(),
                'statusText': response.statusText,
                'url': response.url
            });
        });

        return result;
    }

    killW3wpOnInstance(subscriptionId: string, resourceGroup: string, siteName: string, scmHostName: string, instanceId: string): Observable<boolean> {
        return this.findTargetedSite(siteName).pipe(mergeMap((targetedSite: Site) => {
            if (targetedSite.enabledHostNames.length > 0) {
                const scmHostNameFromSiteObject = targetedSite.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
                if (scmHostNameFromSiteObject !== null && scmHostNameFromSiteObject.length > 0) {
                    scmHostName = scmHostNameFromSiteObject;
                }
            }

            const url: string = this._uriElementsService.getKillSiteProcessUrl(subscriptionId, targetedSite.resourceGroup, targetedSite.name);
            const body: any = {
                'InstanceId': instanceId,
                'ScmHostName': scmHostName
            };

            const requestHeaders: HttpHeaders = this._getHeaders();

            return this._http.post(url, body, { headers: requestHeaders })
                .pipe(map((response: Response) => response.ok));
        }));
    }

    getSiteAppSettings(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): Observable<any> {
        const url: string = this._uriElementsService.getListAppSettingsUrl(subscriptionId, resourceGroup, siteName, slot);
        return this._armClient.postResource(url, {}, null, true);
    }

    getSiteConfigSettings(siteInfo: SiteInfoMetaData): Observable<any> {
        const url: string = this._uriElementsService.getConfigWebUrl(siteInfo);
        return this._armClient.getResource<ResponseMessageEnvelope<any>>(url).pipe(map((response: ResponseMessageEnvelope<any>) => {
            return response.properties;
        }));
    }

    getAlwaysOnSetting(siteInfo: SiteInfoMetaData): Observable<boolean> {
        return this.getSiteConfigSettings(siteInfo).pipe(map(resp => {
            return resp.alwaysOn;
        }));
    }

    getVirtualNetworkConnectionsInformation(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): Observable<any> {

        const url: string = this._uriElementsService.getVirtualNetworkConnections(subscriptionId, resourceGroup, siteName, slot);
        return this._armClient.getResource(url);
    }

    getSiteDaasInfoFromSiteMetadata(): Observable<SiteDaasInfo> {
        return this.currentSiteMetaData.pipe(map(siteInfo => {
            if (siteInfo) {

                const siteInfoMetaData = siteInfo;
                const siteToBeDiagnosed = new SiteDaasInfo();

                siteToBeDiagnosed.subscriptionId = siteInfo.subscriptionId;
                siteToBeDiagnosed.resourceGroupName = siteInfo.resourceGroupName;
                siteToBeDiagnosed.siteName = siteInfo.siteName;
                siteToBeDiagnosed.slot = siteInfo.slot;
                siteToBeDiagnosed.instances = [];

                return siteToBeDiagnosed;
            }
        }));
    }

    updateSiteAppSettings(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '', body: any): Observable<any> {
        const url: string = this._uriElementsService.getUpdateAppSettingsUrl(subscriptionId, resourceGroup, siteName, slot);
        return this._armClient.putResource(url, body, null, true);
    }

    updateSettingsFromUri(resourceUri: string, body: any): Observable<any> {
        const restartUri = this._uriElementsService.getUpdateSettingsUri(resourceUri);

        // TODO: Use new API call to get HttpResponse info; convert body to {string: string} for logging
        this.logService.logEvent('Solution_UpdateAppSettings', {
            'url': resourceUri
        });

        return this._armClient.putResource(restartUri, body, null, true);
    }

    azureApiRequest(method: string, resourceUri: string, body: any = null, apiVersion?: string):
            Observable<HttpResponse<any>> {
        if (!['get', 'put', 'post', 'patch'].includes(method.toLowerCase())) {
            throw new Error(`Method ${method} is not supported in Azure API Request Solutions`);
        }

        this.logService.logEvent('Solution_AzureApiRequest', {
            'url': resourceUri,
            'method': method
        });

        switch (method.toLowerCase()) {
            case 'get':
                return this._armClient.getFullResponse(resourceUri, false, apiVersion);
            case 'put':
                return this._armClient.putFullResponse(resourceUri, body, true, apiVersion);
            case 'post':
                return this._armClient.postResourceFullResponse(resourceUri, body, true, apiVersion);
            case 'patch':
                return this._armClient.patchFullResponse(resourceUri, body, true, apiVersion);
        }
    }

    private _populateSiteInfo(resourceId: string): void {
        const pieces = resourceId.toLowerCase().split('/');
        this.currentSiteMetaData.next(<SiteInfoMetaData>{
            resourceUri: resourceId,
            subscriptionId: pieces[pieces.indexOf('subscriptions') + 1],
            resourceGroupName: pieces[pieces.indexOf('resourcegroups') + 1],
            siteName: pieces[pieces.indexOf('sites') + 1],
            slot: pieces.indexOf('slots') >= 0 ? pieces[pieces.indexOf('slots') + 1] : ''
        });
    }

    private _getHeaders(): HttpHeaders {

        let headers = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/json');
        headers = headers.set('Accept', 'application/json');
        headers = headers.set('Authorization', `Bearer ${this._authService.getAuthToken()}`);

        return headers;
    }
}
