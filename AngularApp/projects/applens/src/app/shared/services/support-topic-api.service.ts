import { Injectable } from '@angular/core';
import { DiagnosticApiService } from './diagnostic-api.service';
import { Observable } from 'rxjs';
import { ResourceService } from '../services/resource.service';

@Injectable()
export class SupportTopicApiService {

  constructor(private _diagnosticApiService: DiagnosticApiService, private _resourceService: ResourceService) { }

  public getServiceHealthCommunications(): Observable<any> {
    return this._diagnosticApiService.get<any>(`api/comms/${this._resourceService.ArmResource.subscriptionId}`);
  }

  public getTemplate(name: string): Observable<string> {
    return this._diagnosticApiService.get<string>(`api/github/template/${name}`, true);
  }

  public getSourceFile(id: string): Observable<string> {
    return this._diagnosticApiService.get<string>(`api/github/package/${id}`, true);
  }
}
