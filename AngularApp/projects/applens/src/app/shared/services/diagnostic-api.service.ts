import { AdalService } from 'adal-angular4';
import { DetectorMetaData, DetectorResponse, QueryResponse } from 'diagnostic-data';
import { Observable } from 'rxjs';
import { map, retry } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpMethod } from '../models/http';
import { Package } from '../models/package';
import { CacheService } from './cache.service';
import {throwError as observableThrowError } from 'rxjs';
import {catchError, tap} from 'rxjs/operators';

@Injectable()
export class DiagnosticApiService {

  public readonly localDiagnosticApi = "http://localhost:5000/";

  constructor(private _httpClient: HttpClient, private _cacheService: CacheService,
    private _adalService: AdalService) { }

  public get diagnosticApi(): string {
    return environment.production ? '' : this.localDiagnosticApi;
  }

  public getDetector(version: string, resourceId: string, detector: string, startTime?: string, endTime?: string,
      body?: any, refresh: boolean = false, internalView: boolean = true, additionalQueryParams? : string):
      Observable<DetectorResponse> {
    let timeParameters = this._getTimeQueryParameters(startTime, endTime);
    let path = `${version}${resourceId}/detectors/${detector}?${timeParameters}`;

    if(additionalQueryParams != undefined) {
      path += additionalQueryParams;
    }

    return this.invoke<DetectorResponse>(path, HttpMethod.POST, body, true, refresh, true, internalView);
  }

  public getSystemInvoker(resourceId: string, detector: string, systemInvokerId: string = '', dataSource: string,
      timeRange: string, body?: any): Observable<DetectorResponse> {
    let invokerParameters = this._getSystemInvokerParameters(dataSource, timeRange);
    let path = `/${resourceId}/detectors/${detector}/statistics/${systemInvokerId}?${invokerParameters}`;

    return this.invoke<DetectorResponse>(path, HttpMethod.POST, body);
  }

  public getDetectors(version: string, resourceId: string, body?: any, internalClient: boolean = true): Observable<DetectorMetaData[]> {
    let path = `${version}${resourceId}/detectors`;
    return this.invoke<DetectorResponse[]>(path, HttpMethod.POST, body, true, false, internalClient).pipe(retry(1), map(response => response.map(detector => detector.metadata)));
  }

  public getUsers(body: any): Observable<any> {
    let url: string = `${this.diagnosticApi}api/graph/users`;
    return  this._httpClient.post(url, body, {
        headers: this._getHeaders()
      });
  }

  public getSupportTopics(pesId: any, useCache: boolean = true, invalidateCache: boolean = false): Observable<any> {
    let url: string = `${this.diagnosticApi}api/supporttopics/${pesId}`;
    let request = this._httpClient.get(url, {
        headers: this._getHeaders()
      });

    return useCache ? this._cacheService.get(this.getCacheKey(HttpMethod.GET, url), request, invalidateCache) : request;
  }

  public getGists(version: string, resourceId: string, body?: any): Observable<DetectorMetaData[]> {
    let path = `${version}${resourceId}/gists`;
    return this.invoke<DetectorResponse[]>(path, HttpMethod.POST, body).pipe(retry(1), map(response => response.map(gist => gist.metadata)));
  }

  public getUserPhoto(userId: string): Observable<any> {
    let url: string = `${this.diagnosticApi}api/graph/users/${userId}`;
    return this._httpClient.get(url, {
      headers: this._getHeaders()
    });
  }

  public getCompilerResponse(version: string, resourceId: string, body: any, startTime?: string, endTime?: string,
      additionalParams?: any): Observable<QueryResponse<DetectorResponse>> {
    let timeParameters = this._getTimeQueryParameters(startTime, endTime);
    let path = `${version}${resourceId}/diagnostics/query?${timeParameters}`;

    if(additionalParams.formQueryParams != undefined) {
      path += additionalParams.formQueryParams;
    }

    return this.invoke<QueryResponse<DetectorResponse>>(path, HttpMethod.POST, body, false, undefined, undefined, undefined,
      undefined, additionalParams);
  }

  public getSystemCompilerResponse(resourceId: string, body: any, detectorId: string = '', dataSource: string = '',
      timeRange: string = '',  additionalParams?: any): Observable<QueryResponse<DetectorResponse>> {
    let invokerParameters = this._getSystemInvokerParameters(dataSource, timeRange);
    let path = `/${resourceId}/detectors/${detectorId}/statisticsQuery?${invokerParameters}`;

    return this.invoke<QueryResponse<DetectorResponse>>(path, HttpMethod.POST, body, false, undefined, undefined, undefined,
      undefined, additionalParams);
  }

  public getLocalDevelopmentResponse(detectorId: string, version: string, resourceId: string, body: any,
      startTime?: string, endTime?: string): Observable<string> {
    let path = resourceId;
    var url: string = `${this.diagnosticApi}api/localdev?detectorId=${detectorId}`;
    let method: HttpMethod = HttpMethod.POST;
    let request = this._httpClient.post<string>(url, body, {
      headers: this._getHeaders(path, method)
    });

    return this._cacheService.get(this.getCacheKey(method, path), request, true);
  }

  public publishPackage(resourceId: string, emailRecipients: string, packageToPublish: Package): Observable<any> {
    let path = `${resourceId}/diagnostics/publish`;

    return this.invoke<any>(path, HttpMethod.POST, packageToPublish, false, true, true, true, emailRecipients);
  }

  public getChangelist(id: string): Observable<any> {
    let url: string = `${this.diagnosticApi}api/github/package/${id}/changelist`;
    return this._httpClient.get(url, {
      headers: this._getHeaders()
    });
  }

  public getChangedFiles(sha: string): Observable<any>{
    let url: string = `${this.diagnosticApi}api/github/package/${sha}/changedfiles`;
    return this._httpClient.get(url, {
      headers: this._getHeaders()
    });
  }

  public getConfigurationChangelist(id: string): Observable<any> {
    let url: string = `${this.diagnosticApi}api/github/package/${id}/configuration/changelist`;
    return this._httpClient.get(url, {
      headers: this._getHeaders()
    });
  }

  public getCommitContentByFilePath(filePath: string, sha: string): Observable<any>{
    let url: string = `${this.diagnosticApi}api/github/package/commit/${sha}/${filePath}`;
    return this._httpClient.get(url, {
      headers: this._getHeaders()
    });
  }

  public getCommitContent(id: string, sha: string): Observable<any> {
    let url: string = `${this.diagnosticApi}api/github/package/${id}/commit/${sha}`;
    return this._httpClient.get(url, {
      headers: this._getHeaders()
    });
  }

  public getCommitConfiguration(id: string, sha: string): Observable<any> {
    let url: string = `${this.diagnosticApi}api/github/package/${id}/configuration/commit/${sha}`;
    return this._httpClient.get(url, {
      headers: this._getHeaders()
    });
  }

  public invoke<T>(path: string, method: HttpMethod = HttpMethod.GET, body: any = {}, useCache: boolean = true,
      invalidateCache: boolean = false, internalClient: boolean = true, internalView: boolean = true, emailRecipients: string="",
      additionalParams?: any): Observable<T> {
    let url = `${this.diagnosticApi}api/invoke`
    let request: Observable<any>;

    if(additionalParams && additionalParams.getFullResponse) {
      request = this._httpClient.post<T>(url, body, {
        headers: this._getHeaders(path, method, internalClient, internalView, emailRecipients, additionalParams),
        observe: 'response'
      });
    } else {
      request = this._httpClient.post<T>(url, body, {
        headers: this._getHeaders(path, method, internalClient, internalView, emailRecipients, additionalParams)
      });
    }

    let keyPostfix = internalClient === true ? "-true" : "-false";
    return useCache ? this._cacheService.get(this.getCacheKey(method, path+keyPostfix), request, invalidateCache) : request;
  }

  private getCacheKey(method: HttpMethod, path: string) {
    return `${HttpMethod[method]}-${path}`;
  }

  public get<T>(path: string, invalidateCache: boolean = false): Observable<T> {
    let url = `${this.diagnosticApi}${path}`;
    let request = this._httpClient.get<T>(url, {
      headers: this._getHeaders()
    });

    return this._cacheService.get(path, request, invalidateCache);
  }

  private _getHeaders(path?: string, method?: HttpMethod, internalClient: boolean = true, internalView: boolean = true, emailRecipients: string = "",
      additionalParams?: any): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');
    headers = headers.set('x-ms-internal-client', String(internalClient));
    headers = headers.set('x-ms-internal-view', String(internalView));
    headers = headers.set('Authorization', `Bearer ${this._adalService.userInfo.token}`)

    if (emailRecipients !== "")
    {
      headers = headers.set('x-ms-emailRecipients', emailRecipients);
    }

    if (path) {
      headers = headers.set('x-ms-path-query', path);
    }

    if (method) {
      headers = headers.set('x-ms-method', HttpMethod[method]);
    }

    if(additionalParams && additionalParams.scriptETag) {
      headers = headers.set('diag-script-etag',additionalParams.scriptETag);
    }

    if(additionalParams && additionalParams.assemblyName) {
      headers = headers.set('diag-assembly-name', encodeURI(additionalParams.assemblyName));
    }

    return headers;
  }

  private _getTimeQueryParameters(startTime: string, endTime: string) {
    return `&startTime=${startTime}&endTime=${endTime}`;
  }

  private _getSystemInvokerParameters(systemDataSource: string, timeRange: string) {
    return `&dataSource=${systemDataSource}&timeRange=${timeRange}`;
  }
}
