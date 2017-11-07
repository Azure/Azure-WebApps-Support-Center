import { Http, Headers, Response, Request } from '@angular/http';
import { Injectable, EventEmitter } from '@angular/core';
import { Subscription } from '../models/subscription';
import { Site } from '../models/site';
import { ArmObj } from '../models/armObj';
import { SiteConfig } from '../models/site-config';
import { Observable, Subscription as RxSubscription, Subject, ReplaySubject } from 'rxjs/Rx';
import { ResourceGroup } from '../models/resource-group';
import { PublishingCredentials } from '../models/publishing-credentials';
import { DeploymentLocations } from '../models/arm/locations';
import { AuthService } from '../services';

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
   
    constructor(private _http: Http, private _authService: AuthService) {
    }

    getResource<T>(resourceUri: string): Observable<{} | T> {
        var url: string = `${this.armUrl}${resourceUri}?api-version=${this.websiteApiVersion}`
        if(resourceUri.indexOf('?') >= 0){
            url =  `${this.armUrl}${resourceUri}&api-version=${this.websiteApiVersion}`
        }

        return this._http.get(url, {
            headers: this.getHeaders()
        })
            .map((response: Response) => <T>response.json())
            .catch(this.handleError);
    }

    // From Support Center Project
    postResource<T>(resourceUri: string, body: any): Observable<boolean | T> {
        var url = `${this.armUrl}${resourceUri}?api-version=${this.websiteApiVersion}`;
        if (body) {
            body = JSON.stringify(body);
        }

        return this._http.post(url, body, { headers: this.getHeaders() })
            .map((response: Response) => <T>response.json())
            .catch((response) => { return Observable.of(false) });
    }


    private handleError(error: Response): any {
        return Observable.throw(error.json().error || 'Server error');
    }

    // From Support Center Project
    getSubscriptions() {
        var url = `${this.armUrl}/subscriptions?api-version=2014-04-01`;
        return this._http.get(url, { headers: this.getHeaders() })
            .map<Response, Subscription[]>(r => r.json().value);
    }

    // From Support Center Project
    search(term: string, subscriptionId: string) {
        if (!term) {
            return Observable.empty<Response>();
        }

        let url = this.armUrl +
            "/subscriptions/" + subscriptionId + "/resources?api-version=" + this.armApiVersion +
            "&$filter=substringof(name, '" + term + "') and " +
            "(resourceType eq 'Microsoft.web/sites' or resourceType eq 'Microsoft.web/sites/slots' " +
            " or resourceType eq 'Microsoft.web/serverFarms' or resourceType eq 'Microsoft.Web/hostingEnvironments')";

        return this._http.get(url, { headers: this.getHeaders() });
    }

    // From Support Center Project
    get(url: string) {
        return this._http.get(url, { headers: this.getHeaders() }).map(r => r.json());
    }

    // From Support Center Project
    getArmCacheResources(subscription: string, type1: string, type2?: string) {
        let url: string;
        if (!type2) {
            url = "{0}/subscriptions/{1}/resources?api-version={2}&$filter=resourceType eq '{3}'".format(
                this.armUrl,
                subscription,
                this.armApiVersion,
                type1);
        }
        else {
            url = "{0}/subscriptions/{1}/resources?api-version={2}&$filter=resourceType eq '{3}' or resourceType eq '{4}'".format(
                this.armUrl,
                subscription,
                this.armApiVersion,
                type1,
                type2);
        }

        return this._http.get(url, { headers: this.getHeaders() })
            .map<Response, ArmObj[]>(r => {
                return r.json().value;
            });
    }

    // From Support Center Project
    getArmResources(resourceId: string, apiVersion?: string) {
        var url = `${this.armUrl}${resourceId}?api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
        return this._http.get(url, { headers: this.getHeaders() })
            .map<Response, ArmObj[]>(r => {
                return r.json().value;
            });
    }

    // From Support Center Project
    getArmResource(resourceId: string, apiVersion?: string) {
        var url = `${this.armUrl}${resourceId}?api-version=${!!apiVersion ? apiVersion : this.websiteApiVersion}`;
        return this._http.get(url, { headers: this.getHeaders() })
            .map<Response, ArmObj>(r => {
                return r.json();
            });
    }

    // From Support Center Project
    send(method: string, url: string, body?: any, etag?: string) {
        let request = new Request({
            url: url,
            method: method,
            search: null,
            headers: this.getHeaders(etag),
            body: body
        });

        return this._http.request(request);
    }

    // From Support Center Project
    postArmResource(resourceId: string, body: any) {
        var url = `${this.armUrl}${resourceId}?api-version=${this.websiteApiVersion}`;
        if (body) {
            body = JSON.stringify(body);
        }

        return this._http.post(url, body, { headers: this.getHeaders() })
            .map<Response, ArmObj>(r => {
                try {
                    return r.json();
                } catch (e) {
                    return "";
                }
            })
            .catch(this.handleError);
    }

    // From Support Center Project
    putArmResource(resourceId: string, body: any, apiVersion?: string) {
        var url = `${this.armUrl}${resourceId}?api-version=${apiVersion ? apiVersion : this.websiteApiVersion}`;
        return this._http.put(url, JSON.stringify(body), { headers: this.getHeaders() })
            .map<Response, ArmObj>(r => r.json());
    }

    // From Support Center Project
    getSite(armId: string) {
        var url = `${this.armUrl}${armId}?api-version=${this.websiteApiVersion}`;
        return this._http.get(url, { headers: this.getHeaders() }).map<Response, Site>(r => r.json());
    }

    // From Support Center Project
    getSlotsForSite(siteId: string) {
        var url = `${this.armUrl}${siteId}/slots?api-version=${this.websiteApiVersion}`;
        return this._http.get(url, { headers: this.getHeaders() })
            .map<Response, Site[]>(r => {
                return r.json().value;
            });
    }

    // From Support Center Project
    validateSiteNameAvailable(subscriptionId: string, containerName: string) {
        var url = `${this.armUrl}/subscriptions/${subscriptionId}/providers/Microsoft.Web/ishostnameavailable/${containerName}?api-version=${this.websiteApiVersion}`;
        return this._http.get(url, { headers: this.getHeaders() })
            .map<Response, boolean>(r => r.json().properties);
    }

    // From Support Center Project
    getDeploymentLocations(subscriptionId: string) {
        let url = `${this.armUrl}/subscriptions/${subscriptionId}/providers/Microsoft.Web/deploymentLocations?api-version=${this.websiteApiVersion}`
        return this._http.get(url, { headers: this.getHeaders() })
            .map<Response, DeploymentLocations>(l => l.json());
    }

    // From Support Center Project
    parseErrorMessage(error: any) {
        let mesg: string;
        if (error._body) {
            let body = JSON.parse(error._body);
            mesg = body.Code + ": " + body.Message;
        }
        else {
            mesg = "Received " + error.status + " on request to " + error.url;
        }

        return mesg;
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