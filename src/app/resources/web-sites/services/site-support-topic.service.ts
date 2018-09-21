import { Injectable } from '@angular/core';
import { SupportTopicService } from '../../../shared-v2/services/support-topic.service';
import { DiagnosticService } from 'applens-diagnostics';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class SiteSupportTopicService extends SupportTopicService {

  private _hardCodedSupportTopicIdMapping = [
    {
      pesId: '14748',
      supportTopicId: '32583701',
      path: '/diagnostics/availability/detectors/sitecpuanalysis/focus',
    },
    {
      pesId: '14748',
      supportTopicId: '32457411',
      path: '/diagnostics/performance/analysis',
    },
    {
      pesId: '14748',
      supportTopicId: '32570954',
      path: '/diagnostics/availability/apprestartanalysis',
    },
    {
      pesId: '14748',
      supportTopicId: '32542218',
      path: '/diagnostics/availability/analysis',
    },
    {
      pesId: '14748',
      supportTopicId: '32581616',
      path: '/diagnostics/availability/memoryanalysis',
    }
  ]

  constructor(protected _diagnosticService: DiagnosticService, protected _resourceService: ResourceService) {
    super(_diagnosticService, _resourceService);
  }

  getPathForSupportTopic(supportTopicId: string, pesId: string): Observable<string> {
    let matchingMapping = this._hardCodedSupportTopicIdMapping.find(
      supportTopic => supportTopic.supportTopicId === supportTopicId &&
        (!pesId || pesId === '' || supportTopic.pesId === pesId)
    );

    if (matchingMapping) {
      return Observable.of(`/legacy${this._resourceService.resourceIdForRouting}${matchingMapping.path}`);
    }
    else {
      return super.getPathForSupportTopic(supportTopicId, pesId);
    }
  }
}
