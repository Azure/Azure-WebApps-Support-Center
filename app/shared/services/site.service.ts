import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ArmService, AuthService, UriElementsService, ServerFarmDataService } from '../services';
import { Observable } from 'rxjs/Observable';
import { StartupInfo } from '../models/portal';
import { Site } from '../models/site'
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ResponseMessageEnvelope } from '../models/responsemessageenvelope';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class SiteService {

    public currentSite: BehaviorSubject<Site> = new BehaviorSubject<Site>(null);

    //TODO: This should be deprecated, but leaving it for now while we move to new solutions
    public currentSiteStatic: Site;

    private siteBehaviorSubject: BehaviorSubject<Site> = new BehaviorSubject<Site>(null);

    constructor(private _armClient: ArmService, private _authService: AuthService, private _http: Http, private _uriElementsService: UriElementsService, private _serverFarmService: ServerFarmDataService) {
        this._authService.getStartupInfo().flatMap((startUpInfo: StartupInfo) => {
            return this._armClient.getResource<Site>(startUpInfo.resourceId);
        }).subscribe((site: ResponseMessageEnvelope<Site>) => {
            this.currentSite.next(site.properties);
        });
    }

    public getCurrentSite(): BehaviorSubject<Site> {
        return this.siteBehaviorSubject;
    }

    // I am making the assumption that two sites on the same server farm must be in the same sub 
    // but they don't necessarily have to be in the same resource group
    private findTargetedSite(siteName: string): Observable<Site> {
        siteName = siteName.toLowerCase();
        return this.currentSite.flatMap(site => {
            if(site.name.toLowerCase() === siteName) {
                return Observable.of<Site>(site);
            }

            return this._serverFarmService.sitesInServerFarm.map(sitesInServerFarm => {
                return sitesInServerFarm.find(site => site.name.toLowerCase() === siteName)
            })
        })
    }

    restartSite(subscriptionId: string, resourceGroup: string, siteName: string): Observable<boolean> {
        return this.findTargetedSite(siteName).flatMap((targetedSite: Site) => {
            var slotName = '';
            var mainSiteName = targetedSite.name;
    
            if (targetedSite.name.indexOf('(') >= 0) {
                let parts = targetedSite.name.split('(');
                mainSiteName = parts[0];
                slotName = parts[1].replace(')', '');
            }
    
            let resourceUri: string = this._uriElementsService.getSiteRestartUrl(subscriptionId, targetedSite.resourceGroup, mainSiteName, slotName);
            return <Observable<boolean>>(this._armClient.postResource(resourceUri, null, null, true));
        });
    }

    killW3wpOnInstance(subscriptionId: string, resourceGroup: string, siteName: string, scmHostName: string, instanceId: string): Observable<boolean> {
        return this.findTargetedSite(siteName).flatMap(targetedSite => {
            if (targetedSite.enabledHostNames.length > 0) {
                let scmHostNameFromSiteObject = targetedSite.enabledHostNames.find(hostname => hostname.indexOf(".scm.") > 0);
                if (scmHostNameFromSiteObject !== null && scmHostNameFromSiteObject.length > 0) {
                    scmHostName = scmHostNameFromSiteObject;
                }
            }
    
            let url: string = this._uriElementsService.getKillSiteProcessUrl(subscriptionId, targetedSite.resourceGroup, targetedSite.name);
            let body: any = {
                "InstanceId": instanceId,
                "ScmHostName": scmHostName
            };
    
            let requestHeaders: Headers = this._getHeaders();
    
            return this._http.post(url, body, { headers: requestHeaders })
                .map((response: Response) => response.ok);
        })
    }

    private _getHeaders(): Headers {

        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');
        headers.append('Authorization', `Bearer ${this._authService.getAuthToken()}`);

        return headers;
    }
}