import { Component, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from 'projects/app-service-diagnostics/src/app/startup/services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';
import { retry } from 'rxjs/operators';
import { MonitoringSession, MonitoringLogsPerInstance, SessionMode } from '../../../models/daas';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'cpu-monitoring-tool',
  templateUrl: './cpu-monitoring-tool.component.html',
  styleUrls: ['./cpu-monitoring-tool.component.scss', '../styles/daasstyles.scss']
})
export class CpuMonitoringToolComponent implements OnInit {

  title: string = 'Enable CPU monitoring';
  description: string = 'If your app is consuming HIGH CPU, you can enable CPU monitoring that allows you to collect data when the app takes high CPU resources and allows you to kill the process';
  daasValidated: boolean = false;
  operationStatus: string;
  editMode: boolean = false;

  thingsToKnowBefore: string[] = [
    'CPU monitoring is light weight and adds 0.02 % CPU overhead per process monitored',
    'Monitoring is enabled on the worker process (w3wp) and all child processes spun by the worker process',
    'When the configured CPU threshold is reached, a memory dump will be triggered. ',
    'When the dump is being generated, the process will be paused for a few seconds till the dump generation finishes.',
    'The size of the dump captured is directly proportional to the amount of memory consumed by the application process',
    'If required, you can configure the monitoring to terminate the process once the dump is generated'
  ];

  siteToBeDiagnosed: SiteDaasInfo;
  scmPath: string;
  couldNotFindSite: boolean = false;
  operationInProgress: boolean = false;
  error: any;
  monitoringEnabled: boolean = false;
  sessionId: string;
  monitoringSession: MonitoringSession;
  originalMonitoringSession: MonitoringSession;
  savingSettings: boolean = false;
  monitoringLogs: MonitoringLogsPerInstance[] = [];
  subscription: Subscription;
  monitoringSessions: MonitoringSession[] = [];
  sessionModeType = SessionMode;

  constructor(private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService) {

    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
    });
  }

  ngOnInit(): void {
    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
    this.monitoringSession = this.getDefaultMonitoringSettings();
  }

  getDefaultMonitoringSettings(): MonitoringSession {

    let monitoringSession = new MonitoringSession();
    monitoringSession.CpuThreshold = 65;
    monitoringSession.MonitorDuration = 15;
    monitoringSession.Mode = SessionMode.CollectAndKill;
    monitoringSession.MaxActions = 2;
    monitoringSession.ThresholdSeconds = 30;
    monitoringSession.MaximumNumberOfHours = 24 * 7;
    return monitoringSession;
  }

  onDaasValidated(validated: boolean) {
    this.daasValidated = true;
    this.checkRunningSessions();
  }

  checkRunningSessions() {
    this.operationInProgress = true;
    this.operationStatus = 'Checking active monitoring session...';

    this._daasService.getActiveMonitoringSessionDetails(this.siteToBeDiagnosed).pipe(retry(2))
      .subscribe(runningSession => {
        this.operationInProgress = false;
        this.operationStatus = '';
        if (runningSession && runningSession.Session) {
          this.monitoringEnabled = true;
          this.sessionId = runningSession.Session.SessionId;
          this.monitoringSession = runningSession.Session;
          this.originalMonitoringSession = runningSession.Session;
          this.monitoringLogs = runningSession.MonitoringLogs;

          this.subscription = interval(15000).subscribe(res => {
            this.getActiveSessionDetails();
          });

        }
      });

    this.getMonitoringSessions();
  }

  getMonitoringSessions() {
    this._daasService.getAllMonitoringSessions(this.siteToBeDiagnosed).subscribe(resp => {
      this.monitoringSessions = resp;
    });
  }
  getActiveSessionDetails() {
    this._daasService.getActiveMonitoringSessionDetails(this.siteToBeDiagnosed)
      .subscribe(resp => {
        if (resp && resp.Session) {
          this.monitoringLogs = resp.MonitoringLogs;
          this.monitoringSession = resp.Session;
        }
        else {
          if (this.subscription) {
            this.subscription.unsubscribe();
            this.monitoringEnabled = false;
          }
        }
      });
  }

  saveCpuMonitoring() {
    this.savingSettings = true;
    this._daasService.stopMonitoringSession(this.siteToBeDiagnosed).subscribe(
      resp => {

        if (this.monitoringEnabled) {

          let newSession: MonitoringSession = new MonitoringSession();
          newSession.MaxActions = this.monitoringSession.MaxActions;
          newSession.Mode = this.monitoringSession.Mode;
          newSession.MonitorDuration = this.monitoringSession.MonitorDuration;
          newSession.ThresholdSeconds = this.monitoringSession.ThresholdSeconds;
          newSession.CpuThreshold = this.monitoringSession.CpuThreshold;
          newSession.MaximumNumberOfHours = this.monitoringSession.MaximumNumberOfHours;

          this._daasService.submitMonitoringSession(this.siteToBeDiagnosed, newSession).subscribe(
            result => {
              this.savingSettings = false;
              this.sessionId = result;
              this.editMode = false;
              this.originalMonitoringSession = newSession;

              this.subscription = interval(15000).subscribe(res => {
                this.getActiveSessionDetails();
              });
            });

        }
        else {
          this.savingSettings = false;
          this.editMode = false;
          this.originalMonitoringSession = null;
        }
      });
  }

  checkForChanges() {
    if ((this.originalMonitoringSession == null && this.monitoringEnabled) || (this.originalMonitoringSession != null && this.monitoringEnabled === false)) {
      this.editMode = true;
    }
    else {
      this.editMode = false;
    }
  }

  cancelChanges() {
    this.editMode = false;
    if (this.originalMonitoringSession == null && this.monitoringEnabled) {
      this.monitoringEnabled = false;
    }
    this.checkForChanges();
  }

  analyzeSession(sessionId: string) {
    this._daasService.analyzeMonitoringSession(this.siteToBeDiagnosed, sessionId).subscribe(resp => {
      if (resp) {
        this.getMonitoringSessions();
      }
    });

  }

  openReport(url: string) {
    this._windowService.open(`https://${this.scmPath}/api/vfs/${url}`);
  }

  getfileNameFromPath(path: string): string {

    let reportNameArray = path.split('/');
    if (reportNameArray.length > 0) {
      return reportNameArray[reportNameArray.length - 1];
    } else {
      return path;
    }
  }



}
