import { Component, OnInit, Inject, Pipe, PipeTransform } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as momentNs from 'moment';
import { DetectorControlService, DurationSelector } from '../../services/detector-control.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';

const moment = momentNs;

@Component({
  selector: 'detector-control',
  templateUrl: './detector-control.component.html',
  styleUrls: ['./detector-control.component.scss']
})
export class DetectorControlComponent implements OnInit {

  startTime: string;
  endTime: string;

  isInternal: boolean;

  constructor(public _router: Router, private _activatedRoute: ActivatedRoute, public detectorControlService: DetectorControlService,
    @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    this.isInternal = !config.isPublic;
  }

  ngOnInit() {
    this.detectorControlService.update.subscribe(validUpdate => {
      if (validUpdate) {
        this.startTime = this.detectorControlService.startTimeString;
        this.endTime = this.detectorControlService.endTimeString;
      }

      let timeParams = {
        'startTime': this.detectorControlService.startTime.format('YYYY-MM-DDTHH:mm'),
        'endTime': this.detectorControlService.endTime.format('YYYY-MM-DDTHH:mm')
      }
      this._router.navigate([], { queryParams: timeParams, relativeTo: this._activatedRoute });

    });
  }

  setManualDate() {
    this.detectorControlService.setCustomStartEnd(this.startTime, this.endTime)
  }
}

@Pipe({
  name:'internal',
  pure: false
})
export class InternalPipe implements PipeTransform {
  transform(items: DurationSelector[], internalClient: boolean) {
    return items ? items.filter(item => !item.internalOnly || internalClient): items;
  }
}

