import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Options } from 'ng5-slider';
import { SiteService } from '../../../../services/site.service';
import { DaasService } from '../../../../services/daas.service';
import { SiteDaasInfo } from '../../../../models/solution-metadata';
import { MonitoringSession, SessionMode } from '../../../../models/daas';
import { retry } from 'rxjs/operators';

@Component({
  selector: 'cpu-monitoring-configuration',
  templateUrl: './cpu-monitoring-configuration.component.html',
  styleUrls: ['./cpu-monitoring-configuration.component.scss']
})
export class CpuMonitoringConfigurationComponent implements OnInit {

  editMode: boolean = false;
  savingSettings: boolean = false;
  monitoringEnabled: boolean = false;
  monitoringSession: MonitoringSession;
  originalMonitoringSession: MonitoringSession;
  sessionId: string = "";
  operationInProgress: boolean = false;
  mode: SessionMode;
  ruleSummary: string = "";
  modeDescription: string = "";

  descStart: string = "In this mode if site's process or child processes of the site's process consume CPU greater than CPU threshold configured for the configured duration";
  descMemoryDump: string = "Memory dump is collected via procdump tool and we check CPU usage every <b>Monitor Duration</b> seconds. The maximum number of memory dumps collected is controlled by the <b>Maximum number of memory dumps to collect</b> setting.";
  descKillMessage: string = "Kindly note this is <b>kill</b> of the process vs. a graceful termination of the process.";

  sessionModeTypes: string[] = ["Kill", "Collect", "CollectAndKill", "CollectKillAndAnalyze"];
  modeDescriptions = [{ Mode: SessionMode.Collect, Description: `${this.descStart}, a memory dump is collected. ${this.descMemoryDump}` },
  { Mode: SessionMode.CollectAndKill, Description: `${this.descStart}, a memory dump is collected and the process consuming high CPU is killed. ${this.descMemoryDump} ${this.descKillMessage}` },
  { Mode: SessionMode.CollectKillAndAnalyze, Description: `${this.descStart}, a memory dump is collected and the process consuming high CPU is killed.   ${this.descMemoryDump} ${this.descKillMessage} Once all the dumps are collected, the tool also analyzes the memory dumps using the Debug Diagnostic tool and presents a dump analysis report.` },
  { Mode: SessionMode.Kill, Description: `${this.descStart}, the process is killed. ${this.descKillMessage} In this mode, the 'Maximum Number of Memory Dumps collected' setting is not honored and the monitoring stops automatically after 'Maximum number of Days' is reached.` }];

  sliderOptionsCpuThreshold: Options = {
    floor: 75, ceil: 95, step: 5, showTicks: true,
    translate: (value: number): string => {
      return value + "%";
    }
  };

  sliderOptionsMonitorDuration: Options = {
    floor: 15, ceil: 60, step: 15, showTicks: true,
    translate: (value: number): string => {
      return value + " sec";
    }
  };
  sliderOptionsThresholdSeconds: Options = {
    floor: 30, ceil: 180, step: 30, showTicks: true,
    translate: (value: number): string => {
      return value + " sec";
    }
  };

  sliderOptionsMaxActions: Options = {
    floor: 1, ceil: 5, showTicks: true
  };


  sliderOptionsMaxDuration: Options = {
    floor: 1, ceil: 168, showTicks: true, step: 1, logScale: true,
    translate: (value: number): string => {
      let label = (value === 1) ? ' hour' : ' hours';
      let displayValue = value.toString();
      if (value > 48) {
        label = ' days';
        displayValue = (value / 24).toPrecision(2);
        displayValue = (displayValue.endsWith(".0")) ? displayValue.substring(0, displayValue.length - 2) : displayValue;
      }
      return displayValue + label;
    }
  };

  @Input() public siteToBeDiagnosed: SiteDaasInfo;
  @Output() public monitoringInProgress: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private _siteService: SiteService, private _daasService: DaasService) { }

  ngOnInit() {
    this.monitoringSession = this.getDefaultMonitoringSettings();
    this.updateRuleSummary();
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
      this.checkRunningSessions();
    });
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

    this._daasService.getActiveMonitoringSessionDetails(this.siteToBeDiagnosed).pipe(retry(2))
      .subscribe(runningSession => {
        this.operationInProgress = false;
        if (runningSession && runningSession.Session) {
          this.monitoringEnabled = true;
          this.sessionId = runningSession.Session.SessionId;
          this.monitoringSession = runningSession.Session;
          this.originalMonitoringSession = runningSession.Session;
          this.monitoringInProgress.emit(true);
          // this.monitoringLogs = runningSession.MonitoringLogs;

          // this.subscription = interval(15000).subscribe(res => {
          //   this.getActiveSessionDetails();
          // });

        }
        else {
          this.monitoringInProgress.emit(false);
        }
      });
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
    this.ruleSummary = `When the site's process or any child processes of the site's process takes <b>${this.monitoringSession.CpuThreshold}%</b> of CPU for more than <b>${this.monitoringSession.ThresholdSeconds}</b> seconds, <b>${actionToTake}</b>. Evaluate CPU usage every <b>${this.monitoringSession.MonitorDuration} seconds</b>.`;
    if (this.monitoringSession.Mode != SessionMode.Kill) {
      this.ruleSummary = this.ruleSummary + ` Collect a maximum of <b>${this.monitoringSession.MaxActions} memory dumps</b>.`;
    }

    this.ruleSummary += ` Monitoring will stop automatically after <b>${this.monitoringSession.MaximumNumberOfHours > 24 ? ((this.monitoringSession.MaximumNumberOfHours) / 24).toPrecision(2) + " days" : this.monitoringSession.MaximumNumberOfHours + " hours"}</b>.`;
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
              this.monitoringEnabled = true;
              this.monitoringInProgress.emit(true);
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

}
