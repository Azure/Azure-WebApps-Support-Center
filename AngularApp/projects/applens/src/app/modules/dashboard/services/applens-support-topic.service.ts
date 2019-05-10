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
   // this.detectorTask = this._diagnosticApiService.getDetectors();
   }

  public getSupportTopics(): Observable<any> {
    let pesId = this._resourceService.pesId;
    let requestBody = this._resourceService.getRequestBody();

    if (pesId === '14748')
    {
        console.log(requestBody);
    }

    return this._diagnosticApiService.getSupportTopics(pesId);
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
