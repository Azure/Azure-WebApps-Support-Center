import { Component, OnInit, Input, OnDestroy, OnChanges, Output, EventEmitter } from '@angular/core';
import { WindowService } from 'projects/app-service-diagnostics/src/app/startup/services/window.service';
import { SiteService } from '../../../../services/site.service';
import { SiteDaasInfo } from '../../../../models/solution-metadata';
import { DaasService } from '../../../../services/daas.service';
import { MonitoringLogsPerInstance, MonitoringSession, SessionMode, AnalysisStatus } from '../../../../models/daas';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'cpu-monitoring-activity',
  templateUrl: './cpu-monitoring-activity.component.html',
  styleUrls: ['./cpu-monitoring-activity.component.scss']
})
export class CpuMonitoringActivityComponent implements OnInit, OnDestroy, OnChanges {

  constructor(private _windowService: WindowService, private _siteService: SiteService, private _daasService: DaasService) {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
    });
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
  sessionCompleted: boolean = false;
  monitoringEnabled: boolean = false;

  ngOnInit() {
    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
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
          // this.sessionCompleted = true;
          this.monitoringEnabled = false;

          // if (this.subscription) {
          //   this._daasService.getAllMonitoringSessions(this.siteToBeDiagnosed).subscribe(allSessions => {
          //     if (allSessions) {
          //       let completedSession = allSessions.find(session => session.SessionId === this.sessionId);
          //       this.monitoringSession = completedSession;

          //       // If the session requires analysis, check if analysis is complete
          //       if (this.monitoringSession.Mode === SessionMode.CollectKillAndAnalyze) {
          //         this.analysisSubscription = interval(15000).subscribe(res => {
          //           this.getCompletedSessionDetails();
          //         });
          //       }
          //     }
          //     this.sessionCompleted = true;
          //     this.monitoringEnabled = false;
          //   });
          //   this.subscription.unsubscribe();
          // }
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

  getCompletedSessionDetails() {
    this._daasService.getAllMonitoringSessions(this.siteToBeDiagnosed).subscribe(allSessions => {
      if (allSessions) {
        let completedSession = allSessions.find(session => session.SessionId === this.sessionId);
        this.monitoringSession = completedSession;
        if (completedSession.AnalysisStatus === AnalysisStatus.Completed) {
          this.analysisSubscription.unsubscribe();
        }
      }
    });
  }

}
