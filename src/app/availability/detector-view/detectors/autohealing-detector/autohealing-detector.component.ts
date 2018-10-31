import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppAnalysisService } from '../../../../shared/services/appanalysis.service';
import { DetectorViewBaseComponent } from '../../detector-view-base/detector-view-base.component';
import { DetectorControlService } from 'applens-diagnostics';
import { IDetectorResponse } from '../../../../shared/models/detectorresponse';

@Component({
  selector: 'autohealing-detector',
  templateUrl: './autohealing-detector.component.html',
  styleUrls: ['./autohealing-detector.component.css']
})
export class AutohealingDetectorComponent extends DetectorViewBaseComponent implements OnInit {

  detectorHasData: boolean = false;

  constructor(protected _route: ActivatedRoute, protected _appAnalysisService: AppAnalysisService, protected _detectorControlService: DetectorControlService) {
    super(_route, _appAnalysisService, _detectorControlService);
  }
  getDetectorName(): string {
    return "autoheal";
  }
  
  static getDetectorName(): string {
    return 'autoheal';
  }

  ngOnInit() {
    super.ngOnInit();
  }

  processDetectorResponse(response: IDetectorResponse) {
    this.detectorResponse = response;
    this.detectorMetrics = response.metrics;
    this.detectorMetricsTitle = this.detectorMetricsTitle != undefined && this.detectorMetricsTitle != '' ?
      this.detectorMetricsTitle : response.detectorDefinition.displayName;
    this.detectorHasData = this.detectorResponse && this.detectorResponse.data.length > 0;
  }
}
