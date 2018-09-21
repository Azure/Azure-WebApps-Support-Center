import { Http, Headers, Response, Request } from '@angular/http';
import { Injectable, EventEmitter } from '@angular/core';
import { ResponseMessageEnvelope } from '../models/responsemessageenvelope'
import { Observable } from 'rxjs/Observable';
import { AuthService } from '../../startup/services/auth.service';
import { ArmService } from './arm.service';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import { DetectorResponse, DetectorMetaData } from 'applens-diagnostics/src/app/diagnostic-data/models/detector';

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

    public getDetector(detectorName: string, startTime: string, endTime: string, refresh?: boolean, internalView?: boolean) {

        if (this.useLocal) {
            let path = `v4${this.resourceId}/detectors/${detectorName}?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net`;
            return this.invoke<DetectorResponse>(path, 'POST');
        }
        else {
            let path = `${this.resourceId}/detectors/${detectorName}?startTime=${startTime}&endTime=${endTime}`;
            return this._armService.getResource<DetectorResponse>(path, '2015-08-01', refresh)
                .map((response: ResponseMessageEnvelope<DetectorResponse>) => response.properties);
        } 
    }

    public invoke<T>(path: string, method = 'GET', body: any = {}): Observable<T> {
        var url: string = `${this.localEndpoint}/api/invoke`

        let request = this._http.post(url, body, {
            headers: this._getHeaders(path, method)
        })
        .retry(2)
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