import { Http, Headers, Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { Subscription } from '../models/subscription';
import { ResponseMessageEnvelope, ResponseMessageCollectionEnvelope } from '../models/responsemessageenvelope'
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { AuthService } from '../../startup/services/auth.service';
import { CacheService } from './cache.service';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/retry';

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
        if(!resourceUri.startsWith('/')) { resourceUri = '/' + resourceUri }
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`

        let request = this._http.get(url, {
            headers: this.getHeaders()
        })
            .retry(2)
            .map((response: Response) => (<ResponseMessageEnvelope<T>>response.json()))
            .catch(this.handleError);

        return this._cache.get(url, request, invalidateCache);
    }

    getArmResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<T> {
        if(!resourceUri.startsWith('/')) { resourceUri = '/' + resourceUri }
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`

        let request = this._http.get(url, {
            headers: this.getHeaders()
        })
            .retry(2)
            .map((response: Response) => (<T>response.json()))
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

    postResource<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        let request = this._http.post(url, bodyString, { headers: this.getHeaders() })
            .retry(2)
            .map((response: Response) => {
                let body = response.text();

                return body && body.length > 0 ? <ResponseMessageEnvelope<T>>(response.json()) : response.ok;
            })
            .catch(this.handleError);

        return this._cache.get(url, request, invalidateCache);
    }

    deleteResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<any> {
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`
        return this._http.delete(url, { headers: this.getHeaders() })
            .map((response: Response) => {
                let body = response.text();
                return body && body.length > 0 ? response.json() : "";
            })
            .catch(this.handleError);
    }

    postResourceWithoutEnvelope<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | T> {
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        let request = this._http.post(url, bodyString, { headers: this.getHeaders() })
            .map((response: Response) => {
                let body = response.text();

                return body && body.length > 0 ? <T>(response.json()) : response.ok;
            })
            .catch(this.handleError);

        return this._cache.get(url, request, invalidateCache);
    }


    putResource<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
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

    patchResource<T, S>(resourceUri: string, body?: S, apiVersion?: string): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        let request = this._http.patch(url, bodyString, { headers: this.getHeaders() })
            .map((response: Response) => {
                let body = response.text();

                return body && body.length > 0 ? <ResponseMessageEnvelope<T>>(response.json()) : response.ok;
            })
            .catch(this.handleError);

        // Always invalidate cache for write calls as we dont want to just hit cache.
        // Setting InvalidateCache = true will make sure that there is an outbound call everytime this method is called.  
        return this._cache.get(url, request, true);
    }

    putResourceWithoutEnvelope<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | T> {
        var url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        let request = this._http.put(url, bodyString, { headers: this.getHeaders() })
            .map((response: Response) => {
                let body = response.text();

                return body && body.length > 0 ? <T>(response.json()) : response.ok;
            })
            .catch(this.handleError);

        return this._cache.get(url, request, invalidateCache);
    }

    private handleError(error: Response): any {
        let actualError
        if (error.text().length > 0) {
            try {
                const errorData = JSON.parse(error.text());
                if (errorData.error) {
                    actualError = errorData.error
                }
                else if (errorData.Message) {
                    actualError = errorData.Message
                }
                else {
                    actualError = 'Server Error';
                }
            } catch (err) {
                actualError = error.text();
            }
        }
        else {
            actualError = error.status + "-" + error.statusText
        }
        return Observable.throw(actualError);
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