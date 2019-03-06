import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, retry } from 'rxjs/operators';
import { Http, Headers, Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../startup/services/auth.service';
import { ArmService } from './arm.service';
import { DetectorResponse, DetectorMetaData } from 'diagnostic-data';

@Injectable()
export class LocalBackendService {
  private localEndpoint = 'http://localhost:5000';

  resourceId: string;

  detectorList: DetectorMetaData[];

  useLocal: boolean = false;

  constructor(private _http: HttpClient, private _armService: ArmService, private _authService: AuthService) {
    this._authService.getStartupInfo().subscribe(info => {
      this.resourceId = info.resourceId.replace('microsoft.web', 'Microsoft.Web');
    });
  }

  public getDetectorById(detectorId: string) {
    return this.detectorList.find(detector => detector.id === detectorId);
  }

  public getDetectors(): Observable<DetectorMetaData[]> {
    const path = `v4${this.resourceId}/detectors`;
    if (this.detectorList) {
      return of(this.detectorList);
    }
    
    return this.invoke<DetectorResponse[]>(path, 'POST').pipe(map(response => {
      this.detectorList = response.map(detector => detector.metadata);
      return this.detectorList;
    }));
  }

  public getDetector(detectorName: string, startTime: string, endTime: string, refresh?: boolean, internalView?: boolean, formQueryParams?: string) {
    let path = `v4${this.resourceId}/detectors/${detectorName}?startTime=${startTime}&endTime=${endTime}`;
    if(formQueryParams != null) {
      path += formQueryParams;
    }
    return this.invoke<DetectorResponse>(path, 'POST');
  }

  public invoke<T>(path: string, method = 'GET', body: any = {}): Observable<T> {
    const url: string = `${this.localEndpoint}/api/invoke`;

    const request = this._http.post<T>(url, body, {
      headers: this._getHeaders(path, method)
    }).pipe(
      retry(2)
    );

    return request;
  }

  private _getHeaders(path?: string, method?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (path) {
      headers = headers.append('x-ms-path-query', path);
    }

    if (method) {
      headers = headers.append('x-ms-method', method);
    }

    return headers;
  }

}

