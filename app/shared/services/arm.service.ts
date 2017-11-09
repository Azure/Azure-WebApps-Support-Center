import { Http, Headers, Response, Request } from '@angular/http';
import { Injectable, EventEmitter } from '@angular/core';
import { Subscription } from '../models/subscription';
import { Site } from '../models/site';
import { ArmObj } from '../models/armObj';
import { SiteConfig } from '../models/site-config';
import { ResponseMessageEnvelope, ResponseMessageCollectionEnvelope } from '../models/responsemessageenvelope'
import { Observable, Subscription as RxSubscription, Subject, ReplaySubject } from 'rxjs/Rx';
import { ResourceGroup } from '../models/resource-group';
import { PublishingCredentials } from '../models/publishing-credentials';
import { DeploymentLocations } from '../models/arm/locations';
import { AuthService, CacheService } from '../services';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class ArmService {
    public subscriptions = new ReplaySubject<Subscription[]>(1);

    public armUrl = 'https://management.azure.com';
    public armApiVersion = '2016-02-01'
    public storageApiVersion = '2015-05-01-preview';
    public websiteApiVersion = '2015-08-01';

    constructor(private _http: Http, private _authService: AuthService, private _cache: CacheService) {
    }

    getResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<{} | ResponseMessageEnvelope<T>> {
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`

        let request = this._http.get(url, {
            headers: this.getHeaders()
        })
            .map((response: Response) => (<ResponseMessageEnvelope<T>>response.json()))
            .catch(this.handleError);

        return this._cache.get(url, request, invalidateCache);
    }

    getResourceWithoutEnvelope<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<{} | T> {
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`

        let request = this._http.get(url, {
            headers: this.getHeaders()
        })
            .map((response: Response) => (<T>response.json()))
            .catch(this.handleError);

        return this._cache.get(url, request, invalidateCache);
    }

    postResource<T,S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        let request = this._http.post(url, bodyString, { headers: this.getHeaders() })
            .map((response: Response) => {
                let body = response.text();

                return body && body.length > 0 ? <ResponseMessageEnvelope<T>>(response.json()) : response.ok;      
            })
            .catch(this.handleError);
        
        return this._cache.get(url, request, invalidateCache);
    }

    putResource<T,S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        let request = this._http.put(url, bodyString, { headers: this.getHeaders() })
            .map((response: Response) => {
                let body = response.text();

                return body && body.length > 0 ? <ResponseMessageEnvelope<T>>(response.json()) : response.ok;      
            })
            .catch(this.handleError);
        
        return this._cache.get(url, request, invalidateCache);
    }

    private handleError(error: Response): any {
        return Observable.throw(error.json().error || 'Server error');
    }

    getResourceCollection<T>(resourceId: string, apiVersion?: string, invalidateCache: boolean = false): Observable<{} | ResponseMessageEnvelope<T>[]> {
        var url = `${this.armUrl}${resourceId}?api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
        let request = this._http.get(url, { headers: this.getHeaders() })
            .map<Response, ResponseMessageEnvelope<T>[]>(r => {
                let collectionEnvelope = <ResponseMessageCollectionEnvelope<ResponseMessageEnvelope<T>>>r.json();
                return collectionEnvelope.value;
            })
            .catch(this.handleError);
        
        return this._cache.get(url, request, invalidateCache);
    }

    // From Support Center Project
    getHeaders(etag?: string): Headers {
        var headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');
        headers.append('Authorization', `Bearer ${this._authService.getAuthToken()}`);

        if (etag) {
            headers.append('If-None-Match', etag);
        }

        return headers;

    }
}