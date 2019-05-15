import { Injectable } from '@angular/core';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { Observable } from 'rxjs';
import { ResourceService } from '../../../shared/services/resource.service';
import { map } from 'rxjs/operators';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { ApplensDiagnosticService } from './applens-diagnostic.service';


@Injectable()
export class ApplensSupportTopicService {

  protected detectorTask: Observable<DetectorMetaData[]>;

  constructor(private _diagnosticApiService: ApplensDiagnosticService, private _resourceService: ResourceService) {
   }

  public getSupportTopics(): Observable<any> {
    let pesId = this.getPesId();
    return this._diagnosticApiService.getSupportTopics(pesId);
  }

  public getPesId(): string {
    let pesId = this._resourceService.pesId;
    let requestBody = this._resourceService.getRequestBody();
    if (pesId === '14748')
    {
        if (requestBody.Kind === "functionapp")
        {
          pesId = '16072';
        }
        else if (requestBody.IsLinux)
        {
          pesId = '16170';
        }
    }

    return pesId;
  }

  public getSelfHelpPath(): string {
    let selfHelpPath = this._resourceService.staticSelfHelpContent;
    let pesId = this._resourceService.pesId;
    let requestBody = this._resourceService.getRequestBody();
    if (pesId === '14748')
    {
        if (requestBody.Kind === "functionapp")
        {
          selfHelpPath = "microsoft.function";
        }
    }

    return selfHelpPath;
  }


  getPathForSupportTopic(supportTopicId: string, pesId: string): Observable<string> {
  //  return this.detectorTask.pipe(map(detectors => {
    return this._diagnosticApiService.getDetectors().pipe(map(detectors => {
      let detectorPath = '';

      if (detectors) {
        const matchingDetector = detectors.find(detector =>
          detector.supportTopicList &&
          detector.supportTopicList.findIndex(supportTopic => supportTopic.id === supportTopicId) >= 0);

        if (matchingDetector) {
          detectorPath = `/detectors/${matchingDetector.id}`;
        }
      }

      return detectorPath;
    }));
  }
}
