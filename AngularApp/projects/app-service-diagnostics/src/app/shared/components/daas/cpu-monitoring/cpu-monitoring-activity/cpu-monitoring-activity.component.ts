import { Component, OnInit, Input, OnChanges, SimpleChange} from '@angular/core';
import { SiteDaasInfo } from '../../../../models/solution-metadata';
import { ActiveMonitoringSession } from '../../../../models/daas';

@Component({
  selector: 'cpu-monitoring-activity',
  templateUrl: './cpu-monitoring-activity.component.html',
  styleUrls: ['./cpu-monitoring-activity.component.scss']
})
export class CpuMonitoringActivityComponent implements OnInit, OnChanges {

  constructor() {
  }

  @Input() scmPath: string;
  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() activeMonitoringSession: ActiveMonitoringSession;

  ngOnInit() {
  }

  ngOnChanges() {
  }
}
