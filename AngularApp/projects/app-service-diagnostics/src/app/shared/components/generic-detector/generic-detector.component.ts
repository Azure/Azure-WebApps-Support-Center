import { Router } from '@angular/router';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TelemetryService, FeatureNavigationService, DiagnosticService, DetectorMetaData, DetectorType } from 'diagnostic-data';
import { AuthService } from '../../../startup/services/auth.service';
import { Subscription } from 'rxjs';
import { ResourceService } from '../../../shared-v2/services/resource.service';

@Component({
  selector: 'generic-detector',
  templateUrl: './generic-detector.component.html',
  styleUrls: ['./generic-detector.component.scss'],
  providers: [
    FeatureNavigationService
  ]
})
export class GenericDetectorComponent implements OnDestroy {
  detector: string;
  analysisDetector: string;
  navigateSub: Subscription;
  analysisMode: boolean = false;

  constructor(private _activatedRoute: ActivatedRoute, private _diagnosticService: DiagnosticService, private _resourceService: ResourceService, private _authServiceInstance: AuthService, private _telemetryService: TelemetryService,
    private _navigator: FeatureNavigationService, private _router: Router) {

    if (this._activatedRoute.snapshot.params['analysisId'] != null) {
      this.analysisDetector = this._activatedRoute.snapshot.params['analysisId'];
      if (this._activatedRoute.snapshot.params['detectorName'] != null) {
        this.detector = this._activatedRoute.snapshot.params['detectorName'];
      }
      else {
        this.detector = this._activatedRoute.snapshot.params['analysisId'];
        this.analysisDetector = this.detector;
      }

    }
    else if (this._activatedRoute.snapshot.params['detectorName'] != null) {
      this.detector = this._activatedRoute.snapshot.params['detectorName'];
    }

    this.navigateSub = this._navigator.OnDetectorNavigate.subscribe((detector: string) => {
      if (detector) {
        let detectorMetaData: DetectorMetaData = this._diagnosticService.getDetectorById(detector);
        if (detectorMetaData.type === DetectorType.Detector) {
          this._router.navigate([`../../detectors/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
        } else if (detectorMetaData.type === DetectorType.Analysis) {
          this._router.navigate([`../../analysis/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
        }

      }
    });

    this.analysisMode = this._activatedRoute.snapshot.data['analysisMode'];

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
          'PortalSessionId': sessionId,
          'AzureServiceName': this._resourceService.azureServiceName
        };
        this._telemetryService.eventPropertiesSubject.next(eventProperties);
      }
    });
  }

  ngOnDestroy() {
    this.navigateSub.unsubscribe();
  }
}