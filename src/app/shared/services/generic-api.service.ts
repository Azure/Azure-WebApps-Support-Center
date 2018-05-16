import { Http, Headers, Response, Request } from '@angular/http';
import { Injectable, EventEmitter } from '@angular/core';
import { Subscription } from '../models/subscription';
import { Site, SiteInfoMetaData } from '../models/site';
import { ArmObj } from '../models/armObj';
import { SiteConfig } from '../models/site-config';
import { ResponseMessageEnvelope, ResponseMessageCollectionEnvelope } from '../models/responsemessageenvelope'
import { Observable, Subscription as RxSubscription, Subject, ReplaySubject } from 'rxjs/Rx';
import { ResourceGroup } from '../models/resource-group';
import { PublishingCredentials } from '../models/publishing-credentials';
import { DeploymentLocations } from '../models/arm/locations';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';
import { ArmService } from './arm.service';
import { SiteService } from './site.service';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import { DetectorResponse, DetectorMetaData } from 'applens-diagnostics/src/app/diagnostic-data/models/detector';
import { ResourceType } from '../models/portal';
import { AseService } from './ase.service';
import { AseInfoMetaData } from '../models/hostingEnvironment';

@Injectable()
export class GenericApiService {
    private localEndpoint = "http://localhost:5000";

    resourceId: string;

    detectorList: DetectorMetaData[];

    useLocal: boolean = false;

    constructor(private _http: Http, private _armService: ArmService, private _authService: AuthService) {
        this._authService.getStartupInfo().subscribe(info => {
            this.resourceId = info.resourceId;
        })
    }

    public getDetectorById(detectorId: string) {
        return this.detectorList.find(detector => detector.id === detectorId);
    }

    public getDetectors(): Observable<DetectorMetaData[]> {

        if (this.useLocal) {
            let path = `v4${this.resourceId}/detectors?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net`;
            return this.invoke<DetectorResponse[]>(path, 'POST').map(response => response.map(detector => detector.metadata));
        }
        else {
            let path = `${this.resourceId}/detectors`;
            return this._armService.getResourceCollection<DetectorResponse[]>(path).map((response: ResponseMessageEnvelope<DetectorResponse>[]) => {
                this.detectorList = response.map(listItem => listItem.properties.metadata);
                return this.detectorList;
            })
        }
    }

    public getDetector(detectorName: string) {

        if (this.useLocal) {
            let path = `v4${this.resourceId}/detectors/${detectorName}?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net`;
            return this.invoke<DetectorResponse>(path, 'POST');
        }
        else {
            let path = `${this.resourceId}/detectors/${detectorName}`;
            return this._armService.getResource<DetectorResponse>(path)
                .map((response: ResponseMessageEnvelope<DetectorResponse>) => response.properties);
        } 
    }

    public invoke<T>(path: string, method = 'GET', body: any = {}): Observable<T> {
        var url: string = `${this.localEndpoint}/api/invoke`

        let request = this._http.post(url, body, {
            headers: this._getHeaders(path, method)
        })
        .map((response: Response) => <T>(response.json()));

        return request;
    }

    private _getHeaders(path?: string, method?: string): Headers {
        var headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');
    
        if (path) {
          headers.append('x-ms-path-query', path);
        }
    
        if (method) {
          headers.append('x-ms-method', method);
        }
    
        return headers;
      }

}