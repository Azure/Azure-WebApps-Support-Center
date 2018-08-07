import { Component, OnInit } from '@angular/core';
import * as moment from 'moment-timezone';
import { GenericApiService } from '../../services/generic-api.service';
import { ActivatedRoute } from '@angular/router';
import { DetectorResponse } from 'applens-diagnostics';
import { TelemetryService } from 'applens-diagnostics';
import { StartupInfo } from '../../models/portal';
import { AuthService } from '../../../startup/services/auth.service';

@Component({
  selector: 'generic-detector',
  templateUrl: './generic-detector.component.html',
  styleUrls: ['./generic-detector.component.css']
})
export class GenericDetectorComponent implements OnInit {
  private _startUpInfo: StartupInfo;
  private _resourceId: string = '';
  private _ticketBladeWorkflowId: string = '';
  private _supportTopicId: string = '';
  private _sessionId: string = '';

  startTime: moment.Moment;
  endTime: moment.Moment;

  detector: string;

  response: DetectorResponse;

  constructor(private _genericDetectorApi: GenericApiService, private _activatedRoute: ActivatedRoute, private _authServiceInstance: AuthService, private _telemetryService: TelemetryService) {
    this.endTime = moment.tz('Etc/UTC');
    this.endTime.startOf('minute').minute(this.endTime.minute() - this.endTime.minute() % 5);
    this.startTime = this.endTime.clone().add(-1, 'days');
    this.detector = this._activatedRoute.snapshot.params['detectorName'];

    this._authServiceInstance.getStartupInfo().subscribe(data => {
      this._startUpInfo = data;
      if (this._startUpInfo) {
        this._resourceId = this._startUpInfo.resourceId ? this._startUpInfo.resourceId : '';
        this._ticketBladeWorkflowId = this._startUpInfo.workflowId ? this._startUpInfo.workflowId : '';
        this._supportTopicId = this._startUpInfo.supportTopicId ? this._startUpInfo.supportTopicId : '';
        this._sessionId = this._startUpInfo.sessionId ? this._startUpInfo.sessionId : '';

        let eventProperties: { [name: string]: string } = {
          "ResourceId": this._resourceId,
          "TicketBladeWorkflowId": this._ticketBladeWorkflowId,
          "SupportTopicId": this._supportTopicId,
          "PortalSessionId": this._sessionId
        }
        _telemetryService.eventPropertiesSubject.next(eventProperties);
      }
    });
  }

  ngOnInit() {
    this._genericDetectorApi.getDetector(this.detector).subscribe(res => {
      if (res) {
        this.response = res;
      }
    });
  }
}
