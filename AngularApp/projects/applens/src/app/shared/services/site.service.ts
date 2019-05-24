import { BehaviorSubject, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { RESOURCE_SERVICE_INPUTS, ResourceServiceInputs } from '../models/resources';
import { ObserverService } from './observer.service';
import { ResourceService } from './resource.service';
import { HttpResponse } from '@angular/common/http';

@Injectable()
export class SiteService extends ResourceService {

    private _currentResource: BehaviorSubject<Observer.ObserverSiteInfo> = new BehaviorSubject(null);

    private _siteObject: Observer.ObserverSiteInfo;

    constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs, protected _observerApiService: ObserverService) {
        super(inputs);
    }

    public startInitializationObservable() {
        this._initialized = this._observerApiService.getSite(this._armResource.resourceName).pipe(
            mergeMap((observerResponse: Observer.ObserverSiteResponse) => {
                this._siteObject = this.getSiteFromObserverResponse(observerResponse);
                this._currentResource.next(this._siteObject);
                return this._observerApiService.getSiteRequestBody(this._siteObject.SiteName, this._siteObject.InternalStampName);
            }), map((requestBody: any) => {
                if (!requestBody.details.HostNames) {
                    requestBody.details.HostNames = this._siteObject.Hostnames.map(hostname => <any>{
                        name: hostname,
                        type: 0
                    });
                }
                this._requestBody = requestBody.details;
                this.updatePesIdAndImgSrc();
                return true;
            }));
    }

    public getCurrentResource(): Observable<any> {
        return this._currentResource;
    }

    public restartSiteFromUri(resourceUri: string): Observable<HttpResponse<any>> {
        return null;
    }

    public updateSettingsFromUri(resourceUri: string, body: any): Observable<any> {
        return null;
    }

    private getSiteFromObserverResponse(observerResponse: Observer.ObserverSiteResponse): Observer.ObserverSiteInfo {
        return observerResponse.details.find(site =>
            site.Subscription.toLowerCase() === this._armResource.subscriptionId.toLowerCase() &&
            site.ResourceGroupName.toLowerCase() === this._armResource.resourceGroup.toLowerCase())
    }

    public updatePesIdAndImgSrc() {
        if (this._requestBody.Kind === "functionapp") {
            this.pesId = '16072';
            this.imgSrc = 'assets/img/Azure-Functions-Logo.png';
        }
        else if (this._requestBody.IsLinux) {
            this.pesId = '16170';
            this.imgSrc = 'assets/img/Azure-Tux-Logo.png';
        }
    }
}
