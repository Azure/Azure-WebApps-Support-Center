import { Injectable } from '@angular/core';
import { DiagnosticService, DetectorMetaData } from 'applens-diagnostics';
import { Observable } from '../../../../node_modules/rxjs';
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

  // return this._genericApi.getDetectors().map(detectors => {
  //     if (detectors) {
  //         let matchingDetector = detectors.find(detector =>
  //             detector.supportTopicList &&
  //             detector.supportTopicList.findIndex(supportTopic => supportTopic.id === info.supportTopicId) >= 0);

  //         if (matchingDetector) {
  //             return `/detectors/${matchingDetector.id}`;
  //         }
  //     }

  //     let matchingMapping = this._hardCodedSupportTopicIdMapping
  //         .find(supportTopic => supportTopic.supportTopicId === info.supportTopicId && (!info.pesId || info.pesId === '' || supportTopic.pesId === info.pesId))

  //     return matchingMapping ? matchingMapping.path : '/diagnostics';
  // })
  //     .catch((error, caught) => {
  //         return '/diagnostics';
  //     });
}
