import { Injectable } from '@angular/core';
import { DiagnosticService, DetectorMetaData } from 'applens-diagnostics';
import { Observable } from 'rxjs'
import { ResourceService } from './resource.service';

@Injectable()
export class SupportTopicService {

  protected detectorTask: Observable<DetectorMetaData[]>;

  constructor(protected _diagnosticService: DiagnosticService, protected _resourceService: ResourceService) {
    this.detectorTask = this._diagnosticService.getDetectors();
  }

  getPathForSupportTopic(supportTopicId: string, pesId: string): Observable<string> {
    return this.detectorTask.map(detectors => {
      let detectorPath = '';

      if (detectors) {
        let matchingDetector = detectors.find(detector =>
          detector.supportTopicList &&
          detector.supportTopicList.findIndex(supportTopic => supportTopic.id === supportTopicId) >= 0);

        if(matchingDetector) {
          detectorPath = `/detectors/${matchingDetector.id}`;
        }
      }

      return `${this._resourceService.resourceIdForRouting}${detectorPath}`;
    });
  }
}
