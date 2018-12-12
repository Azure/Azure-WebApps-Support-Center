import { Component } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import * as momentNs from 'moment';
import { Router, ActivatedRoute } from '@angular/router';
import { DetectorControlService } from 'diagnostic-data';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  startTime: momentNs.Moment;
  endTime: momentNs.Moment;

  contentHeight: string;

  constructor(public resourceService: ResourceService, private _detectorControlService: DetectorControlService,
    private _router: Router, private _activatedRoute: ActivatedRoute) {
    this.contentHeight = (window.innerHeight - 50) + 'px';

    // Add time params to route if not already present
    if (!this._activatedRoute.queryParams['startTime'] || !this._activatedRoute.queryParams['endTime']) {
      let timeParams = {
        'startTime': this._detectorControlService.startTime.format('YYYY-MM-DDTHH:mm'),
        'endTime': this._detectorControlService.endTime.format('YYYY-MM-DDTHH:mm')
      }
      this._router.navigate([], { queryParams: timeParams, relativeTo: this._activatedRoute });
    }
  }


  reloadHome() {
    window.location.href = '/';
  }

}
