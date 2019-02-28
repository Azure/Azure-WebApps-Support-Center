import { Component, OnInit, Input, OnDestroy, OnChanges, Output, EventEmitter } from '@angular/core';
import { SiteDaasInfo } from '../../../../models/solution-metadata';
import { DaasService } from '../../../../services/daas.service';
import { MonitoringLogsPerInstance, MonitoringSession } from '../../../../models/daas';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'cpu-monitoring-activity',
  templateUrl: './cpu-monitoring-activity.component.html',
  styleUrls: ['./cpu-monitoring-activity.component.scss']
})
export class CpuMonitoringActivityComponent implements OnInit, OnDestroy, OnChanges {

  constructor(private _daasService: DaasService) {
  }

  @Input() public scmPath: string;
  @Input() public siteToBeDiagnosed: SiteDaasInfo;
  @Input() public monitoringInProgress: boolean = false;
  
  @Output() public activeSessionChanged: EventEmitter<MonitoringSession> = new EventEmitter<MonitoringSession>();

  monitoringLogs: MonitoringLogsPerInstance[] = [];
  subscription: Subscription;
  analysisSubscription: Subscription;
  monitoringSession: MonitoringSession;
  sessionId: string = "";
  monitoringEnabled: boolean = false;

  ngOnInit() {
    this.checkForChanges();
  }

  ngOnChanges() {
    this.checkForChanges();
  }

  checkForChanges() {
    if (this.monitoringInProgress) {
      this.monitoringEnabled = true;
      this.subscription = interval(15000).subscribe(res => {
        this.getActiveSessionDetails();
      });
    }
    else {
      this.monitoringEnabled = false;
    }
  }

  getActiveSessionDetails() {
    this._daasService.getActiveMonitoringSessionDetails(this.siteToBeDiagnosed)
      .subscribe(resp => {
        if (resp && resp.Session) {
          this.monitoringLogs = resp.MonitoringLogs;
          this.monitoringSession = resp.Session;
          this.activeSessionChanged.emit(resp.Session);
        }
        else {
          this.activeSessionChanged.emit(null);
          if (this.subscription) {
            this.subscription.unsubscribe();
          }

          this.monitoringEnabled = false;
        }
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.analysisSubscription) {
      this.analysisSubscription.unsubscribe();
    }
  }

}
