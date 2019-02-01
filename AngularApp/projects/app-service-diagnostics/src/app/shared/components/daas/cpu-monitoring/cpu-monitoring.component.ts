import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { MonitoringSession, SessionMode, MonitoringLogsPerInstance } from '../../../models/daas';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Subscription, interval } from 'rxjs';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from 'projects/app-service-diagnostics/src/app/startup/services/window.service';
import { retry } from 'rxjs/operators';

@Component({
  selector: 'cpu-monitoring',
  templateUrl: './cpu-monitoring.component.html',
  styleUrls: ['./cpu-monitoring.component.scss']
})
export class CpuMonitoringComponent implements OnInit, OnDestroy {

  @Input() public siteToBeDiagnosed: SiteDaasInfo;
  @Input() public scmPath: string;

  daasValidated: boolean = false;
  operationStatus: string;
  editMode: boolean = false;
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
  mode: SessionMode;
  ruleSummary: string = "";

  descStart: string = "In this mode if site's process or child processes of the site's process consume CPU greater than CPU threshold configured for the configured duration";
  descMemoryDump: string = "Memory dump is collected via procdump tool and we check CPU usage every <b>Monitor Duration</b> seconds. The maximum number of memory dumps collected is controlled by the <b>Maximum number of memory dumps to collect</b> setting.";
  descKillMessage: string = "Kindly note this is <b>kill</b> of the process vs. a graceful termination of the process.";

  sessionModeTypes: string[] = ["Kill", "Collect", "CollectAndKill", "CollectKillAndAnalyze"];
  modeDescriptions = [{ Mode: SessionMode.Collect, Description: `${this.descStart}, a memory dump is collected. ${this.descMemoryDump}` },
  { Mode: SessionMode.CollectAndKill, Description: `${this.descStart}, a memory dump is collected and the process consuming high CPU is killed. ${this.descMemoryDump} ${this.descKillMessage}` },
  { Mode: SessionMode.CollectKillAndAnalyze, Description: `${this.descStart}, a memory dump is collected and the process consuming high CPU is killed.   ${this.descMemoryDump} ${this.descKillMessage} Once all the dumps are collected, the tool also analyzes the memory dumps using the Debug Diagnostic tool and presents a dump analysis report.` },
  { Mode: SessionMode.Kill, Description: `${this.descStart}, the process is killed. ${this.descKillMessage} In this mode, the 'Maximum Number of Memory Dumps collected' setting is not honored and the monitoring stops automatically after 'Maximum number of Days' is reached.` }];

  modeDescription: string = "";

  constructor(private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService) {

    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
    });
  }

  onDaasValidated(validated: boolean) {
    this.daasValidated = true;
    this.checkRunningSessions();
  }

  ngOnInit(): void {
    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
    this.monitoringSession = this.getDefaultMonitoringSettings();
    this.updateRuleSummary();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

  }

  getDefaultMonitoringSettings(): MonitoringSession {

    let monitoringSession = new MonitoringSession();
    monitoringSession.CpuThreshold = 75;
    monitoringSession.MonitorDuration = 15;
    monitoringSession.Mode = SessionMode.CollectAndKill;
    monitoringSession.MaxActions = 2;
    monitoringSession.ThresholdSeconds = 30;
    monitoringSession.MaximumNumberOfHours = 24 * 7;
    this.mode = monitoringSession.Mode;
    this.selectMode(this.mode);
    return monitoringSession;
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

  selectMode(md: string) {
    this.mode = SessionMode[md];
    this.modeDescription = this.modeDescriptions.find(x => x.Mode === this.mode).Description;
    if (this.monitoringSession != null) {
      this.monitoringSession.Mode = this.mode;
      this.updateRuleSummary();
    }
  }

  updateRuleSummary() {
    let actionToTake = "";
    switch (this.monitoringSession.Mode) {
      case SessionMode.Collect:
        actionToTake = "collect a memory dump";
        break;
      case SessionMode.CollectAndKill:
        actionToTake = "collect a memory dump and kill the process";
        break;
      case SessionMode.CollectKillAndAnalyze:
        actionToTake = "collect a memory dump and analyze when all the dumps have been collected";
        break;
      case SessionMode.Kill:
        actionToTake = "kill the process";
        break;

    }
    this.ruleSummary = `When the site's process or any child processes of the site's process take ${this.monitoringSession.CpuThreshold} % of CPU for more than ${this.monitoringSession.MonitorDuration} seconds, ${actionToTake}. Peform the check for CPU usage every ${this.monitoringSession.MonitorDuration} seconds`;
    if (this.monitoringSession.Mode != SessionMode.Kill){
      this.ruleSummary = this.ruleSummary + `. Collect a maximum of ${this.monitoringSession.MaxActions} memory dumps.`;
    }
  }

}

