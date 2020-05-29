
import { throwError as observableThrowError, ReplaySubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Subscription } from '../models/subscription';
import { ResponseMessageEnvelope, ResponseMessageCollectionEnvelope } from '../models/responsemessageenvelope';
import { AuthService } from '../../startup/services/auth.service';
import { CacheService } from './cache.service';
import { catchError, retry, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { GenericArmConfigService } from './generic-arm-config.service';
import { StartupInfo } from '../models/portal';
import { DemoSubscriptions } from '../../betaSubscriptions';
import { VersioningHelper } from '../../../app/shared/utilities/versioningHelper';
import { PortalKustoTelemetryService } from './portal-kusto-telemetry.service';

@Injectable()
export class ArmService {
    public subscriptions = new ReplaySubject<Subscription[]>(1);

    public armApiVersion = '2016-02-01';
    public storageApiVersion = '2015-05-01-preview';
    public websiteApiVersion = '2015-08-01';
    private readonly publicAzureArmUrl = 'https://management.azure.com';
    private readonly chinaAzureArmUrl = 'https://management.chinacloudapi.cn';
    private readonly usGovernmentAzureArmUrl = 'https://management.usgovcloudapi.net';
    private readonly blackforestAzureArmUrl = 'https://management.microsoftazure.de';
    private readonly usnatAzureArmUrl = 'https://management.azure.eaglex.ic.gov';
    private diagRoleVersion: string = '';
    private readonly routeToLiberation = '2';
    private readonly routeToDiagnosticRole = '1';
    private armEndpoint:string = '';
    constructor(private _http: HttpClient, private _authService: AuthService, private _cache: CacheService, private _genericArmConfigService?: GenericArmConfigService,
        private telemetryService?: PortalKustoTelemetryService ) {
        this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
            if(!!startupInfo.armEndpoint && startupInfo.armEndpoint !='' && startupInfo.armEndpoint.length > 1) {
                this.armEndpoint = startupInfo.armEndpoint ;
            }
            let resourceId = startupInfo.resourceId;
            let subscriptionId = resourceId.split('/')[2];
            this.diagRoleVersion = this.routeToLiberation;
        });
    }

    get isPublicAzure():boolean {
        return this.armUrl === this.publicAzureArmUrl;
    }

    get isFairfax(): boolean {
        return this.armUrl === this.usGovernmentAzureArmUrl;
    }

    get isBlackforest(): boolean {
        return this.armUrl === this.blackforestAzureArmUrl;
    }

    get isMooncake(): boolean {
        return this.armUrl ===  this.chinaAzureArmUrl;
    }

    get isUsnat(): boolean {
        return this.armUrl ===  this.usnatAzureArmUrl;
    }

    get isNationalCloud(): boolean {
        return this.isMooncake || this.isFairfax || this.isBlackforest || this.isUsnat;
    }

    get armUrl(): string {
        if(this.armEndpoint !='' && this.armEndpoint.length > 1 ) {
            return  this.armEndpoint;
        }
        else {
            let browserUrl = (window.location != window.parent.location) ? document.referrer : document.location.href;
            let armUrl = this.publicAzureArmUrl;

            if (browserUrl.includes("azure.cn")){
                armUrl = this.chinaAzureArmUrl;
            }
            else if(browserUrl.includes("azure.us")){
                armUrl = this.usGovernmentAzureArmUrl;
            } else if(browserUrl.includes("azure.de")) {
                armUrl = this.blackforestAzureArmUrl;
            }

            return armUrl;
        }
    }

    getApiVersion(resourceUri: string, apiVersion?: string): string {
        if (apiVersion) {
            return apiVersion;
        }
        else {
            if (this._genericArmConfigService) {
                apiVersion = this._genericArmConfigService.getApiVersion(resourceUri);
            }
            if (!apiVersion || apiVersion == '') {
                return this.websiteApiVersion;
            }
            else {
                return apiVersion;
            }
        }
    }

    createUrl(resourceUri: string, apiVersion?: string) {
        return `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}` +
            `api-version=${this.getApiVersion(resourceUri, apiVersion)}`;
    }

    getResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<{} | ResponseMessageEnvelope<T>> {
        if (!resourceUri.startsWith('/')) {
            resourceUri = '/' + resourceUri;
        }
        const url = this.createUrl(resourceUri, apiVersion);
        let subscriptionLocation = '';
        this.getSubscriptionLocation(resourceUri.split("subscriptions/")[1].split("/")[0]).subscribe(response => {
            subscriptionLocation = response.body['subscriptionPolicies']['locationPlacementId'];
        });
        let additionalHeaders = new Map<string, string>();
        additionalHeaders.set('x-ms-subscription-location-placementid', subscriptionLocation);
        // When x-ms-diagversion is set to 1, the requests will be sent to DiagnosticRole.
        //If the value is set to other than 1 or if the header is not present at all, requests will go to runtimehost
        additionalHeaders.set('x-ms-diagversion', this.diagRoleVersion);
        // This is just for logs so that we know requests are coming from Portal.
        if(this.diagRoleVersion === this.routeToLiberation) {
            additionalHeaders.set('x-ms-azureportal', 'true');
        }
        let eventProps = {
            'resourceId' : resourceUri,
            'targetRuntime': this.diagRoleVersion == this.routeToLiberation ? "Liberation" : "DiagnosticRole"
        };
        this.telemetryService.logEvent("RequestRoutingDetails", eventProps);
        const request = this._http.get<ResponseMessageEnvelope<T>>(url, {
            headers: this.getHeaders(null, additionalHeaders)
        }).pipe(
            retry(2),
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    getArmResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<T> {
        if (!resourceUri.startsWith('/')) {
            resourceUri = '/' + resourceUri;
        }

        const url = this.createUrl(resourceUri, apiVersion);

        const request = this._http.get<T>(url, {
            headers: this.getHeaders()
        }).pipe(
            retry(2),
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    getResourceWithoutEnvelope<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<{} | T> {
        const url = this.createUrl(resourceUri, apiVersion);

        const request = this._http.get<T>(url, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    postResource<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false, appendBodyToCacheKey: boolean = false): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.post<S>(url, bodyString, { headers: this.getHeaders() }).pipe(
            retry(2),
            catchError(this.handleError)
        );

        let cacheKey: string = appendBodyToCacheKey ? url + bodyString : url;

        return this._cache.get(cacheKey, request, invalidateCache);
    }

    deleteResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<any> {
        const url = this.createUrl(resourceUri, apiVersion);
        return this._http.delete(url, { headers: this.getHeaders() }).pipe(
            catchError(this.handleError)
        );
    }

    postResourceWithoutEnvelope<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | T> {
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.post<T>(url, bodyString, { headers: this.getHeaders() }).pipe(
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    putResource<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.put(url, bodyString, { headers: this.getHeaders() }).pipe(
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    patchResource<T, S>(resourceUri: string, body?: S, apiVersion?: string): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.patch(url, bodyString, { headers: this.getHeaders() }).pipe(
            catchError(this.handleError)
        );

        // Always invalidate cache for write calls as we dont want to just hit cache.
        // Setting InvalidateCache = true will make sure that there is an outbound call everytime this method is called.
        return this._cache.get(url, request, true);
    }

    putResourceWithoutEnvelope<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = true): Observable<boolean | {} | T> {
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.put(url, bodyString, { headers: this.getHeaders() }).pipe(
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    postResourceFullResponse<T>(resourceUri: string, body: any, invalidateCache: boolean = false, apiVersion?: string):
        Observable<HttpResponse<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        const request = this._http.post<T>(url, body, {
            headers: this.getHeaders(),
            observe: 'response'
        });

        return this._cache.get(resourceUri, request, invalidateCache);
    }

    putResourceFullResponse<T>(resourceUri: string, body: any = null, invalidateCache = false, apiVersion?: string):
        Observable<HttpResponse<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        const request = this._http.put<T>(url, body, {
            headers: this.getHeaders(),
            observe: 'response'
        });

        return this._cache.get(resourceUri, request, invalidateCache);
    }

    patchResourceFullResponse<T>(resourceUri: string, body: any = null, invalidateCache = false, apiVersion?: string):
        Observable<HttpResponse<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        const request = this._http.patch<T>(url, body, {
            headers: this.getHeaders(),
            observe: 'response'
        });

        return this._cache.get(resourceUri, request, invalidateCache);
    }

    getResourceFullResponse<T>(resourceUri: string, invalidateCache = false, apiVersion?: string):
        Observable<HttpResponse<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        const request = this._http.get<T>(url, {
            headers: this.getHeaders(),
            observe: 'response'
        });

        return this._cache.get(resourceUri, request, invalidateCache);
    }

    getResourceFullUrl<T>(resourceUri: string, invalidateCache: boolean = false): Observable<T> {
        const request = this._http.get<T>(resourceUri, {
            headers: this.getHeaders()
        });

        return this._cache.get(resourceUri, request, invalidateCache);
    }

    private handleError(error: HttpErrorResponse): any {
        let actualError = "";
        const loggingError = new Error();
        const loggingProps = {};

        if (error) {
            if (error.error) {
                actualError = JSON.stringify(error.error);
                if (error.error instanceof ErrorEvent) {
                    loggingError.message = error.error.message;
                    loggingProps['reason']= "A client-side or network error occured.";
                }
            }
            else if (error.message) {
                loggingProps['reason']= "Server side unsuccessful response code.";
            } else {
                actualError = 'Server Error';
            }
            loggingProps['url']= error.url;
            loggingProps['status'] = error.status.toString();
            loggingProps['statusText'] = error.statusText;
        }

        if (!loggingError.message) {
            loggingError.message = actualError;
        }

        if (this.telemetryService)
        {
            this.telemetryService.logException(loggingError, null, loggingProps);
        }

        return observableThrowError(actualError);
    }

    getResourceCollection<T>(resourceId: string, apiVersion?: string, invalidateCache: boolean = false, queryParams: any[] = []): Observable<{} | ResponseMessageCollectionEnvelope<T>> {
        var url = `${this.armUrl}${resourceId}?api-version=${this.getApiVersion(resourceId, apiVersion)}`;
        if (queryParams && queryParams.length > 0) {
            queryParams.forEach(param => {
                url = url + "&" + param["key"] + "=" + encodeURIComponent(param["value"]);
            });
        }

        let additionalHeaders = new Map<string, string>();
        // When x-ms-diagversion is set to 1, the requests will be sent to DiagnosticRole.
        //If the value is set to other than 1 or if the header is not present at all, requests will go to runtimehost
        additionalHeaders.set('x-ms-diagversion', this.diagRoleVersion);
         // This is just for logs so that we know requests are coming from Portal.
         if(this.diagRoleVersion === this.routeToLiberation) {
            additionalHeaders.set('x-ms-azureportal', 'true');
        }

        let eventProps = {
            'resourceId' : resourceId,
            'targetRuntime': this.diagRoleVersion == this.routeToLiberation ? "Liberation" : "DiagnosticRole"
        };
        this.telemetryService.logEvent("RequestRoutingDetails", eventProps);
        const request = this._http.get(url, { headers: this.getHeaders(null, additionalHeaders) }).pipe(
            map<ResponseMessageCollectionEnvelope<ResponseMessageEnvelope<T>>, ResponseMessageEnvelope<T>[]>(r => r.value),
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    getSubscriptionLocation(subscriptionId: string): Observable<HttpResponse<any>> {
        return this.getResourceFullResponse<any>(`/subscriptions/${subscriptionId}`, false, '2019-06-01');
    }

    getHeaders(etag?: string, additionalHeaders?: Map<string, string>): HttpHeaders {
        let headers = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/json');
        headers = headers.set('Accept', 'application/json');
        headers = headers.set('Authorization', `Bearer ${this._authService.getAuthToken()}`);

        if (etag) {
            headers = headers.set('If-None-Match', etag);
        }

        if(additionalHeaders) {
            additionalHeaders.forEach((headerVal: string, headerKey: string) => {
                if(headerVal.length > 0 && headerKey.length > 0) {
                    headers = headers.set(headerKey, headerVal);
                }
            });
        }

        return headers;
    }
}
