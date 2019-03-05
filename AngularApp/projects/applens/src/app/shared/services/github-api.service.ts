import { Injectable } from '@angular/core';
import { DiagnosticApiService } from './diagnostic-api.service';
import { Observable } from 'rxjs';
import { Commit } from '../models/commit';
import { Dependency } from '../models/package';
import { map } from 'rxjs/operators';

@Injectable()
export class GithubApiService {

  constructor(private _diagnosticApiService: DiagnosticApiService) { }

  public getTemplate(name: string): Observable<string> {
    return this._diagnosticApiService.get<string>(`api/github/template/${name}`, true);
  }

  public getSourceFile(id: string): Observable<string> {
    return this._diagnosticApiService.get<string>(`api/github/package/${id}`, true);
  }

  public getSystemInvokerFile(id: string): Observable<string> {
    return this._diagnosticApiService.get<string>(`api/github/package/${id}`, true);
  }

  public getSystemMonitoringFile(detectorId: string, invokerId: string): Observable<string> {
    return this._diagnosticApiService.get<string>(`api/github/package/${detectorId}/statistics/${invokerId}`, true);
  }

  public getSourceReference(id: string, version: string): Observable<string> {
    return this.getCommitContent(id, version);
  }

  public getChangelist(id: string): Observable<Commit[]> {
    return this._diagnosticApiService.getChangelist(id);
  }

  public getCommitContent(id: string, sha: string): Observable<string> {
    return this._diagnosticApiService.getCommitContent(id, sha);
  }

  public getConfiguration(id: string): Observable<object> {
    return this._diagnosticApiService.get<string>(`api/github/package/${id}/configuration`, true).pipe(
      map(conf =>{
        if(conf === "") return {};
        return JSON.parse(conf);
      }));
  }
}