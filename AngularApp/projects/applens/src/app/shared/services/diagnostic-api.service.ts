import { AdalService } from 'adal-angular4';
import { DetectorMetaData, DetectorResponse, QueryResponse } from 'diagnostic-data';
import { map, retry } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpMethod } from '../models/http';
import { Package } from '../models/package';
import { CacheService } from './cache.service';
import { throwError as observableThrowError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class DiagnosticApiService {

  public readonly localDiagnosticApi = "http://localhost:5000/";
  public GeomasterServiceAddress: string = null;
  public Location: string = null;

  constructor(private _httpClient: HttpClient, private _cacheService: CacheService,
    private _adalService: AdalService) { }

  public get diagnosticApi(): string {
    return environment.production ? '' : this.localDiagnosticApi;
  }

  public getDetector(version: string, resourceId: string, detector: string, startTime?: string, endTime?: string,
    body?: any, refresh: boolean = false, internalView: boolean = true, additionalQueryParams?: string):
    Observable<DetectorResponse> {
    let timeParameters = this._getTimeQueryParameters(startTime, endTime);
    let path = `${version}${resourceId}/detectors/${detector}?${timeParameters}`;

    if (additionalQueryParams != undefined) {
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

  public getDetectors(version: string, resourceId: string, body?: any, queryParams?: any[], internalClient: boolean = true): Observable<DetectorMetaData[]> {
    let path = `${version}${resourceId}/detectors`;
    if (queryParams) {
      path = path + "?" + queryParams.map(qp => qp.key + "=" + qp.value).join("&");
    }
    return this.invoke<DetectorResponse[]>(path, HttpMethod.POST, body, true, false, internalClient).pipe(retry(1), map(response => response.map(detector => detector.metadata)));
  }

  public getUserPhoto(userId: string, useCache: boolean = true, invalidateCache: boolean = false): Observable<any> {
    let url: string = `${this.diagnosticApi}api/graph/userPhotos/${userId}`;
    let request = this._httpClient.get(url, {
      headers: this._getHeaders()
    });

    return useCache ? this._cacheService.get(this.getCacheKey(HttpMethod.POST, url), request, invalidateCache) : request;
  }

  public getUserInfo(userId: string, useCache: boolean = true, invalidateCache: boolean = false): Observable<any> {
    let url: string = `${this.diagnosticApi}api/graph/users/${userId}`;
    let request = this._httpClient.get(url, {
      headers: this._getHeaders()
    });

    return useCache ? this._cacheService.get(this.getCacheKey(HttpMethod.POST, url), request, invalidateCache) : request;
  }

  public getUsers(body: any, useCache: boolean = true, invalidateCache: boolean = false): Observable<any> {
    let url: string = `${this.diagnosticApi}api/graph/userPhotos`;
    let request = this._httpClient.post(url, body, {
      headers: this._getHeaders()
    });

    return useCache ? this._cacheService.get(this.getCacheKey(HttpMethod.POST, url + body.toString()), request, invalidateCache) : request;
  }

  public getHasTestersAccess(useCache: boolean = true, invalidateCache: boolean = false): Observable<any> {
    let url: string = `${this.diagnosticApi}api/hasTestersAccess`;
    let request = this._httpClient.get(url, {
      headers: this._getHeaders()
    });

    return useCache ? this._cacheService.get(this.getCacheKey(HttpMethod.POST, url), request, invalidateCache) : request;
  }

  public requestTemporaryAccess(): Observable<any> {
    let url: string = `${this.diagnosticApi}temporaryAccess/requestAccess`;
    let request = this._httpClient.get(url, {
      headers: this._getHeaders()
    });
    return request;
  }

  public getSupportTopics(pesId: any, useCache: boolean = true, invalidateCache: boolean = false): Observable<any> {
    let url: string = `${this.diagnosticApi}api/supporttopics/${pesId}`;
    let request = this._httpClient.get(url, {
      headers: this._getHeaders()
    });

    return useCache ? this._cacheService.get(this.getCacheKey(HttpMethod.GET, url), request, invalidateCache) : request;
  }

  public getSelfHelpContent(pesId: string, supportTopicId: string, path: string, useCache: boolean = true, invalidateCache: boolean = false): Observable<any> {
    let url: string = `${this.diagnosticApi}api/selfhelp/pesId/${pesId}/supportTopicId/${supportTopicId}/path/${path}`;
    let request = this._httpClient.get(url, {
      headers: this._getHeaders()
    });

    return useCache ? this._cacheService.get(this.getCacheKey(HttpMethod.GET, url), request, invalidateCache) : request;
  }

  public getGists(version: string, resourceId: string, body?: any): Observable<DetectorMetaData[]> {
    let path = `${version}${resourceId}/gists`;
    return this.invoke<DetectorResponse[]>(path, HttpMethod.POST, body).pipe(retry(1), map(response => response.map(gist => gist.metadata)));
  }

  public getCompilerResponse(version: string, resourceId: string, body: any, startTime?: string, endTime?: string,
    additionalParams?: any): Observable<QueryResponse<DetectorResponse>> {
    let timeParameters = this._getTimeQueryParameters(startTime, endTime);
    let path = `${version}${resourceId}/diagnostics/query?${timeParameters}`;

    if (additionalParams.formQueryParams != undefined) {
      path += additionalParams.formQueryParams;
    }

    if (additionalParams.detectorUtterances) {
      path += "&detectorUtterances=" + additionalParams.detectorUtterances;
    }

    return this._getCompilerResponseInternal(path, body, additionalParams);
  }

  public getSystemCompilerResponse(resourceId: string, body: any, detectorId: string = '', dataSource: string = '',
    timeRange: string = '', additionalParams?: any): Observable<QueryResponse<DetectorResponse>> {
    let invokerParameters = this._getSystemInvokerParameters(dataSource, timeRange);
    let path = `/${resourceId}/detectors/${detectorId}/statisticsQuery?${invokerParameters}`;
    return this._getCompilerResponseInternal(path, body, additionalParams);
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
    var modifiedByAlias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : 'user';
    modifiedByAlias = modifiedByAlias.replace('@microsoft.com', '');
    let additionalHeaders = new Map<string, string>();
    additionalHeaders.set('x-ms-modifiedBy', modifiedByAlias);
    additionalHeaders.set('x-ms-emailRecipients', emailRecipients);
    return this.invoke<any>(path, HttpMethod.POST, packageToPublish, false, true, true, true, false, additionalHeaders);
  }

  public getChangelist(id: string): Observable<any> {
    let url: string = `${this.diagnosticApi}api/github/package/${id}/changelist`;
    return this._httpClient.get(url, {
      headers: this._getHeaders()
    });
  }

  public getChangedFiles(sha: string): Observable<any> {
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

  public getCommitContentByFilePath(filePath: string, sha: string): Observable<any> {
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
    invalidateCache: boolean = false, internalClient: boolean = true, internalView: boolean = true, getFullResponse?: boolean,
    additionalHeaders?: Map<string, string>): Observable<T> {
    let url = `${this.diagnosticApi}api/invoke`
    let request: Observable<any>;

    if (getFullResponse) {
      request = this._httpClient.post<T>(url, body, {
        headers: this._getHeaders(path, method, internalClient, internalView, additionalHeaders),
        observe: 'response'
      });
    } else {
      request = this._httpClient.post<T>(url, body, {
        headers: this._getHeaders(path, method, internalClient, internalView, additionalHeaders)
      });
    }

    let keyPostfix = internalClient === true ? "-true" : "-false";
    return useCache ? this._cacheService.get(this.getCacheKey(method, path + keyPostfix), request, invalidateCache) : request;
  }

  public get<T>(path: string, invalidateCache: boolean = false): Observable<T> {
    let url = `${this.diagnosticApi}${path}`;
    let request = this._httpClient.get<T>(url, {
      headers: this._getHeaders()
    });

    return this._cacheService.get(path, request, invalidateCache);
  }

  private getCacheKey(method: HttpMethod, path: string) {
    return `${HttpMethod[method]}-${path}`;
  }

  private _getHeaders(path?: string, method?: HttpMethod, internalClient: boolean = true, internalView: boolean = true, additionalHeaders?: Map<string, string>): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');
    headers = headers.set('x-ms-internal-client', String(internalClient));
    headers = headers.set('x-ms-internal-view', String(internalView));

    if (environment.adal.enabled) {
      headers = headers.set('Authorization', `Bearer ${this._adalService.userInfo.token}`)
    }

    if (this.GeomasterServiceAddress)
      headers = headers.set("x-ms-geomaster-hostname", this.GeomasterServiceAddress);

    if (path) {
      headers = headers.set('x-ms-path-query', encodeURI(path));
    }

    if (method) {
      headers = headers.set('x-ms-method', HttpMethod[method]);
    }

    if (this.Location) {
      headers = headers.set('x-ms-location', encodeURI(this.Location));
    }

    if (additionalHeaders) {
      additionalHeaders.forEach((headerVal: string, headerKey: string) => {
        if (headerVal.length > 0 && headerKey.length > 0) {
          headers = headers.set(headerKey, headerVal);
        }
      });
    }

    return headers;
  }

  private _getTimeQueryParameters(startTime: string, endTime: string) {
    return `&startTime=${startTime}&endTime=${endTime}`;
  }

  private _getSystemInvokerParameters(systemDataSource: string, timeRange: string) {
    return `&dataSource=${systemDataSource}&timeRange=${timeRange}`;
  }

  private _getCompilerResponseInternal(path: string, body: any, additionalParams?: any): Observable<QueryResponse<DetectorResponse>> {

    let additionalHeaders = new Map<string, string>();
    if (additionalParams && additionalParams.scriptETag) {
      additionalHeaders = additionalHeaders.set('diag-script-etag', additionalParams.scriptETag);
    }

    if (additionalParams && additionalParams.assemblyName) {
      additionalHeaders = additionalHeaders.set('diag-assembly-name', encodeURI(additionalParams.assemblyName));
    }

    return this.invoke<QueryResponse<DetectorResponse>>(path, HttpMethod.POST, body, false, undefined, undefined, undefined,
      additionalParams.getFullResponse, additionalHeaders);
  }
}
