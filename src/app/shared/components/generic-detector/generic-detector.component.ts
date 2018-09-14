import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TelemetryService } from 'applens-diagnostics';
import { AuthService } from '../../../startup/services/auth.service';

@Component({
  selector: 'generic-detector',
  templateUrl: './generic-detector.component.html',
  styleUrls: ['./generic-detector.component.css']
})
export class GenericDetectorComponent {
  detector: string;

  constructor(private _activatedRoute: ActivatedRoute, private _authServiceInstance: AuthService, private _telemetryService: TelemetryService) {
    this.detector = this._activatedRoute.snapshot.params['detectorName'];

    this._authServiceInstance.getStartupInfo().subscribe(startUpInfo => {
      if (startUpInfo) {
        let resourceId = startUpInfo.resourceId ? startUpInfo.resourceId : '';
        let ticketBladeWorkflowId = startUpInfo.workflowId ? startUpInfo.workflowId : '';
        let supportTopicId = startUpInfo.supportTopicId ? startUpInfo.supportTopicId : '';
        let sessionId = startUpInfo.sessionId ? startUpInfo.sessionId : '';

        let eventProperties: { [name: string]: string } = {
          "ResourceId": resourceId,
          "TicketBladeWorkflowId": ticketBladeWorkflowId,
          "SupportTopicId": supportTopicId,
          "PortalSessionId": sessionId
        }
       this._telemetryService.eventPropertiesSubject.next(eventProperties);
      }
    });
  }
}
