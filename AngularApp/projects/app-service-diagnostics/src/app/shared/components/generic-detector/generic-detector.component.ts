import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TelemetryService } from 'diagnostic-data';
import { AuthService } from '../../../startup/services/auth.service';

@Component({
  selector: 'generic-detector',
  templateUrl: './generic-detector.component.html',
  styleUrls: ['./generic-detector.component.scss']
})
export class GenericDetectorComponent {
  detector: string;

  constructor(private _activatedRoute: ActivatedRoute, private _authServiceInstance: AuthService, private _telemetryService: TelemetryService) {
    this.detector = this._activatedRoute.snapshot.params['detectorName'];

    this._authServiceInstance.getStartupInfo().subscribe(startUpInfo => {
      if (startUpInfo) {
        const resourceId = startUpInfo.resourceId ? startUpInfo.resourceId : '';
        const ticketBladeWorkflowId = startUpInfo.workflowId ? startUpInfo.workflowId : '';
        const supportTopicId = startUpInfo.supportTopicId ? startUpInfo.supportTopicId : '';
        const sessionId = startUpInfo.sessionId ? startUpInfo.sessionId : '';

        const eventProperties: { [name: string]: string } = {
          'ResourceId': resourceId,
          'TicketBladeWorkflowId': ticketBladeWorkflowId,
          'SupportTopicId': supportTopicId,
          'PortalSessionId': sessionId
        };
       this._telemetryService.eventPropertiesSubject.next(eventProperties);
      }
    });
  }
}
