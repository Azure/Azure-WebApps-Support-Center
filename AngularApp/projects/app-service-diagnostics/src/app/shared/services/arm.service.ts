
import { throwError as observableThrowError, ReplaySubject, Observable } from 'rxjs';
import { Http, Headers, Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { Subscription } from '../models/subscription';
import { ResponseMessageEnvelope, ResponseMessageCollectionEnvelope } from '../models/responsemessageenvelope';
import { AuthService } from '../../startup/services/auth.service';
import { CacheService } from './cache.service';
import { catchError, retry, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';


@Injectable()
export class ArmService {
    public subscriptions = new ReplaySubject<Subscription[]>(1);

    public armUrl = 'https://management.azure.com';
    public armApiVersion = '2016-02-01';
    public storageApiVersion = '2015-05-01-preview';
    public websiteApiVersion = '2015-08-01';

    constructor(private _http: HttpClient, private _authService: AuthService, private _cache: CacheService) {
    }

    getResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<{} | ResponseMessageEnvelope<T>> {
        if (!resourceUri.startsWith('/')) { resourceUri = '/' + resourceUri; }
        const url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;

        const request = this._http.get<ResponseMessageEnvelope<T>>(url, {
            headers: this.getHeaders()
        }).pipe(
            retry(2),
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    getArmResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<T> {
        if (!resourceUri.startsWith('/')) { resourceUri = '/' + resourceUri; }
        const url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;

        const request = this._http.get<T>(url, {
            headers: this.getHeaders()
        }).pipe(
            retry(2),
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    getResourceWithoutEnvelope<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<{} | T> {
        const url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;

        const request = this._http.get<T>(url, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    postResource<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        const url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.post<S>(url, bodyString, { headers: this.getHeaders() }).pipe(
            retry(2),
            // map((response: Response) => {
            //     let body = response.text();

            //     return body && body.length > 0 ? <ResponseMessageEnvelope<T>>(response.json()) : response.ok;
            // }),
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    deleteResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<any> {
        const url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
        return this._http.delete(url, { headers: this.getHeaders() }).pipe(
            // map((response: Response) => {
            //     let body = response.text();
            //     return body && body.length > 0 ? response.json() : "";
            // }),
            catchError(this.handleError)
        );
    }

    postResourceWithoutEnvelope<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | T> {
        const url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
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
        const url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
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
        const url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
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

    putResourceWithoutEnvelope<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | T> {
        const url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.put(url, bodyString, { headers: this.getHeaders() }).pipe(
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    postResourceFullResponse<T>(resourceUri: string, invalidateCache: boolean = false, apiVersion?: string): Observable<HttpResponse<T>> {
        const url: string = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
        const request = this._http.post<T>(url, null, {
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

    private handleError(error: any): any {
        let actualError;
        if (error) {
            if (error.message) {
                actualError = error.message;
            } else {
                actualError = 'Server Error';
            }
        }
        return observableThrowError(actualError);
    }

    getResourceCollection<T>(resourceId: string, apiVersion?: string, invalidateCache: boolean = false): Observable<{} | ResponseMessageCollectionEnvelope<T>> {
        const url = `${this.armUrl}${resourceId}?api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
        const request = this._http.get(url, { headers: this.getHeaders() }).pipe(
            map<ResponseMessageCollectionEnvelope<ResponseMessageEnvelope<T>>, ResponseMessageEnvelope<T>[]>(r => r.value),
            catchError(this.handleError)
        );

        return this._cache.get(url, request, invalidateCache);
    }

    getHeaders(etag?: string): HttpHeaders {
        let headers = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/json');
        headers = headers.set('Accept', 'application/json');
        headers = headers.set('Authorization', `Bearer ${this._authService.getAuthToken()}`);

        if (etag) {
            headers = headers.set('If-None-Match', etag);
        }

        return headers;

    }
}
