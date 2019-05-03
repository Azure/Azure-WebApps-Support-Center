import { Subscription } from 'rxjs';
import { Component, OnDestroy } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import * as momentNs from 'moment';
import { Router, ActivatedRoute } from '@angular/router';
<<<<<<< HEAD
import { DetectorControlService, FeatureNavigationService, DetectorMetaData, DetectorType } from 'diagnostic-data';
=======
import { DetectorControlService, FeatureNavigationService } from 'diagnostic-data';
>>>>>>> add graph client
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnDestroy {

  startTime: momentNs.Moment;
  endTime: momentNs.Moment;

  contentHeight: string;

  navigateSub: Subscription;
  userPhotoSource: string;

  constructor(public resourceService: ResourceService, private _detectorControlService: DetectorControlService,
    private _router: Router, private _diagnosticService: ApplensDiagnosticService, private _activatedRoute: ActivatedRoute, private _navigator: FeatureNavigationService) {
    this.contentHeight = (window.innerHeight - 50) + 'px';

    this.navigateSub = this._navigator.OnDetectorNavigate.subscribe((detector: string) => {
      if (detector) {
        this._router.navigate([`./detectors/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });

        this._diagnosticService.getDetectors().subscribe(detectors => {
          let detectorMetaData: DetectorMetaData = detectors.find(d => d.id.toLowerCase() === detector.toLowerCase());
          if (detectorMetaData) {
            if (detectorMetaData.type === DetectorType.Detector) {
              this._router.navigate([`./detectors/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
            } else if (detectorMetaData.type === DetectorType.Analysis) {
              this._router.navigate([`./analysis/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
            }
          }
        });
      }
    });

    // Add time params to route if not already present
    if (!this._activatedRoute.queryParams['startTime'] || !this._activatedRoute.queryParams['endTime']) {
      let routeParams = {
        'startTime': this._detectorControlService.startTime.format('YYYY-MM-DDTHH:mm'),
        'endTime': this._detectorControlService.endTime.format('YYYY-MM-DDTHH:mm')
      }
      // If browser URL contains detectorQueryParams, adding it to route
      if (!this._activatedRoute.queryParams['detectorQueryParams']) {
        routeParams['detectorQueryParams'] = this._activatedRoute.snapshot.queryParams['detectorQueryParams'];
      }
      this._router.navigate([], { queryParams: routeParams, relativeTo: this._activatedRoute });
    }


    this._diagnosticService.getUserPhoto("xipeng").subscribe(image => {
        this.userPhotoSource =  'data:image/jpeg;base64,' + image;
    });
  }

  reloadHome() {
    window.location.href = '/';
  }

  ngOnDestroy() {
    this.navigateSub.unsubscribe();
  }

}
