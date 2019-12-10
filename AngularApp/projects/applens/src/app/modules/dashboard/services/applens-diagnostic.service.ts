import { Injectable } from '@angular/core';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { DetectorResponse, DetectorMetaData } from 'diagnostic-data';
import { Observable } from 'rxjs';
import { QueryResponse } from 'diagnostic-data';
import { Package } from '../../../shared/models/package';

@Injectable()
export class ApplensDiagnosticService {

  constructor(private _diagnosticApi: DiagnosticApiService, private _resourceService: ResourceService) {
  }

  getDetector(detector: string, startTime: string, endTime: string, refresh: boolean = false, internalView: boolean = true, formQueryParams?: string): Observable<DetectorResponse> {
    return this._diagnosticApi.getDetector(
      this._resourceService.versionPrefix,
      this._resourceService.getCurrentResourceId(true),
      detector,
      startTime,
      endTime,
      null,
      refresh,
      internalView,
      formQueryParams);
  }

  getSystemInvoker(detector: string, systemInvokerId: string = '', dataSource: string, timeRange: string): Observable<DetectorResponse> {
    return this._diagnosticApi.getSystemInvoker(
      this._resourceService.getCurrentResourceId(true),
      detector,
      systemInvokerId,
      dataSource,
      timeRange,
      null);
  }

  getDetectors(internalClient: boolean = true, query?: string): Observable<DetectorMetaData[]> {
    var queryParams: any[] = null;
    if (query != null)
      queryParams = [{ "key": "text", "value": encodeURIComponent(query) }];
      return this._diagnosticApi.getDetectors(
        this._resourceService.versionPrefix, 
        this._resourceService.getCurrentResourceId(true),
        null,
        queryParams,
        internalClient);
  }

  getDetectorsSearch(query: string, internalClient: boolean = true): Observable<DetectorMetaData[]> {
    var queryParams: any[] = null;
    if (query != null)
      queryParams = [{ "key": "text", "value": encodeURIComponent(query) }];
      return this._diagnosticApi.getDetectors(
        this._resourceService.versionPrefix, 
        this._resourceService.getCurrentResourceId(true),
        null,
        queryParams,
        internalClient);
  }

  getUsers(body: any): Observable<any> {
    return this._diagnosticApi.getUsers(body);
  }

  getSupportTopics(pesId: any): Observable<any> {
    return this._diagnosticApi.getSupportTopics(pesId);
  }

  getSearchEnabledForProductId(): Observable<any> {
    let pesId = this._resourceService.pesId;
    return this._diagnosticApi.get(`api/github/search/isEnabledForProductId/${pesId}`, true);
  }

  getSelfHelpContent(pesId: string = "14748", supportTopicId: string = "32581605", path: string = "microsoft.web"): Observable<any> {
    return this._diagnosticApi.getSelfHelpContent(pesId, supportTopicId, path);
  }

  getGists(): Observable<DetectorMetaData[]> {
    return this._diagnosticApi.getGists(
      this._resourceService.versionPrefix,
      this._resourceService.getCurrentResourceId(true),
      null);
  }


  getUserPhoto(userId: string = ""): Observable<any> {
    return this._diagnosticApi.getUserPhoto(userId);
  }

  getUserInfo(userId: string = ""): Observable<any> {
    return this._diagnosticApi.getUserInfo(userId);
  }

  getHasTestersAccess(): Observable<any> {
    return this._diagnosticApi.getHasTestersAccess();
  }

  getCompilerResponse(body: any, isSystemInvoker: boolean, detectorId: string = '', startTime: string = '', endTime: string = '', dataSource: string = '', timeRange: string = '', additionalParams: any): Observable<QueryResponse<DetectorResponse>> {
    if (isSystemInvoker === false)
    {
      return this._diagnosticApi.getCompilerResponse(
        this._resourceService.versionPrefix,
        this._resourceService.getCurrentResourceId(true),
        body,
        startTime,
        endTime,
        additionalParams);
    }
    else
    {
      return this._diagnosticApi.getSystemCompilerResponse(
        this._resourceService.getCurrentResourceId(true),
        body,
        detectorId,
        dataSource,
        timeRange,
        additionalParams);
    }
  }

  prepareLocalDevelopment(body: any, detectorId: string = '', startTime: string = '', endTime: string = '', dataSource: string = '', timeRange: string = ''): Observable<string> {
    detectorId = detectorId === '' ? 'newdetector' : detectorId;
    return this._diagnosticApi.getLocalDevelopmentResponse(
      detectorId.toLowerCase(),
      this._resourceService.versionPrefix,
      '/'+this._resourceService.getCurrentResourceId(true),
      body,
      startTime,
      endTime);
  }

  publishDetector(emailRecipients: string, pkg: Package) : Observable<any> {
    return this._diagnosticApi.publishPackage(
      this._resourceService.getCurrentResourceId(true),
      emailRecipients,
      pkg
    );
  }
}
