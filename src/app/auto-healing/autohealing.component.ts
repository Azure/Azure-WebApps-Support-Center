import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DetectorViewBaseComponent } from '../availability/detector-view/detector-view-base/detector-view-base.component';
import { SiteInfoMetaData } from '../shared/models/site';
import { SiteService } from '../shared/services/site.service';
import { AutohealingService } from '../shared/services/autohealing.service';
import { IDetectorResponse } from '../shared/models/detectorresponse';
import { FormatHelper } from '../shared/utilities/formattingHelper';
import { AppAnalysisService } from '../shared/services/appanalysis.service';
import { AutoHealSettings, AutoHealCustomAction, AutoHealRules, AutoHealActions, AutoHealTriggers, AutoHealActionType } from '../shared/models/autohealing';

@Component({
  selector: 'autohealing',
  templateUrl: './autohealing.component.html',
  styleUrls: ['./autohealing.component.css']
})
export class AutohealingComponent extends DetectorViewBaseComponent implements OnInit {
  @Input()
  autohealingSettings: AutoHealSettings;
  originalAutoHealSettings: AutoHealSettings;

  siteToBeDiagnosed: SiteInfoMetaData;
  retrievingAutohealSettings: boolean = true;
  savingAutohealSettings: boolean = false;

  triggerSelected: number = -1;
  actionSelected: number = -1;
  actionCollapsed: boolean = true;

  saveEnabled: boolean = false;
  changesSaved: boolean = false;
  triggers = [];
  actions = [];
  originalSettings: any;
  currentSettings: any;
  customAction: AutoHealCustomAction = null;
  errorMessage: string = "";
  errorMessageSaving: string = "";
  minProcessExecutionTime: number;
  minProcessExecutionTimeExpanded: boolean = false;
  showAutoHealHistory: boolean = false;
  detectorHasData: boolean = false;
  validationWarning: string[];

  constructor(private _siteService: SiteService, private _autohealingService: AutohealingService, protected _route: ActivatedRoute, protected _appAnalysisService: AppAnalysisService) {
    super(_route, _appAnalysisService);
  }

  getDetectorName(): string {
    return "autoheal";
  }

  processDetectorResponse(response: IDetectorResponse) {
    this.detectorResponse = response;
    this.detectorMetrics = response.metrics;
    this.detectorMetricsTitle = this.detectorMetricsTitle != undefined && this.detectorMetricsTitle != '' ?
      this.detectorMetricsTitle : response.detectorDefinition.displayName;
    this.detectorHasData = this.detectorResponse && this.detectorResponse.data.length > 0;
  }

  ngOnInit() {
    super.ngOnInit();
    this._siteService.currentSiteMetaData.subscribe(siteInfo => {
      if (siteInfo) {
        this.siteToBeDiagnosed = siteInfo;
        this._autohealingService.getAutohealSettings(this.siteToBeDiagnosed).subscribe(autoHealSettings => {
          this.retrievingAutohealSettings = false;
          this.errorMessage = "";
          this.autohealingSettings = autoHealSettings;
          this.initComponent(this.autohealingSettings);
        },
          err => {
            this.retrievingAutohealSettings = false;
            this.errorMessage = `Failed with an error ${JSON.stringify(err)} while retrieving autoheal settings`;
          });
      }
    });
  }

  initComponent(autoHealSettings: AutoHealSettings) {
    this.originalSettings = JSON.stringify(autoHealSettings);
    this.originalAutoHealSettings = JSON.parse(this.originalSettings);
    this.updateConditionsAndActions();
    this.updateSummaryText();
  }

  updateConditionsAndActions() {
    if (this.autohealingSettings != null && this.autohealingSettings.autoHealRules != null && this.autohealingSettings.autoHealRules.actions != null) {
      if (this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime != null) {
        this.minProcessExecutionTime = FormatHelper.timespanToSeconds(this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime);
      }
      else {
        this.minProcessExecutionTime = 0;
      }

      this.actionSelected = this.autohealingSettings.autoHealRules.actions.actionType;
      if (this.autohealingSettings.autoHealRules.actions.actionType === AutoHealActionType.CustomAction) {
        this.customAction = this.autohealingSettings.autoHealRules.actions.customAction;
      }
    }
    else {
      this.autohealingSettings = new AutoHealSettings();
      this.autohealingSettings.autoHealRules = new AutoHealRules();
      this.autohealingSettings.autoHealRules.actions = new AutoHealActions();
      this.autohealingSettings.autoHealRules.triggers = new AutoHealTriggers();
    }
    this.initTriggersAndActions();
  }

  saveMinProcessTimeChanged(val: number) {
    this.minProcessExecutionTime = val;
    if (this.autohealingSettings.autoHealRules.actions != null) {
      if (this.minProcessExecutionTime != null && this.minProcessExecutionTime != 0) {
        this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime = FormatHelper.secondsToTimespan(this.minProcessExecutionTime);
      }
      else {
        this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime = FormatHelper.secondsToTimespan(0);
      }
      this.checkForChanges();
    }
    this.collapseAllTiles();
  }

  checkForChanges() {
    let originalAutoHealSettingsString = JSON.stringify(this.originalAutoHealSettings);
    if (originalAutoHealSettingsString != JSON.stringify(this.autohealingSettings)) {
      this.saveEnabled = true;
    }
    else {
      this.saveEnabled = false;
    }
    this.updateSummaryText();
  }

  updateCustomAction(action: AutoHealCustomAction) {

    this.customAction = action;
    this.autohealingSettings.autoHealRules.actions.customAction = this.customAction;
    this.checkForChanges();
    this.actionCollapsed = true;
  }

  saveChanges() {
    this.savingAutohealSettings = true;
    this._autohealingService.updateAutohealSettings(this.siteToBeDiagnosed, this.autohealingSettings)
      .subscribe(savedAutoHealSettings => {
        this.saveEnabled = false;
        this.errorMessageSaving = "";
        this.savingAutohealSettings = false;
        this.changesSaved = true;
        setTimeout(() => {
          this.changesSaved = false;
        }, 3000);

        this.customAction = null;
        this.actionSelected = -1;
        this.minProcessExecutionTime = 0;
        this.autohealingSettings = savedAutoHealSettings;
        this.collapseAllTiles();

        this.initComponent(savedAutoHealSettings);
      },
        err => {
          this.savingAutohealSettings = false;
          this.errorMessageSaving = `Failed with an error ${JSON.stringify(err)} while saving autoheal settings`;
        });
  }

  updateTriggerStatus(triggerRule: number) {
    this.actionCollapsed = true;
    this.minProcessExecutionTimeExpanded = false;
    if (this.autohealingSettings.autoHealRules.triggers == null) {
      this.autohealingSettings.autoHealRules.triggers = new AutoHealTriggers();
    }
    this.triggerSelected != triggerRule ? this.triggerSelected = triggerRule : this.triggerSelected = -1;
  }

  updateActionStatus(action: number) {

    // collapse the conditions pane
    this.triggerSelected = -1;
    this.minProcessExecutionTimeExpanded = false;

    //this is to allow user to collapse the action tile if they click it again
    if (this.actionSelected != action) {
      this.actionCollapsed = false;
    }
    else {
      this.actionCollapsed = !this.actionCollapsed;
    }

    this.actionSelected = action;
    if (this.autohealingSettings.autoHealRules.actions == null) {
      this.autohealingSettings.autoHealRules.actions = new AutoHealActions();
      if (this.minProcessExecutionTime > 0) {
        this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime = FormatHelper.secondsToTimespan(this.minProcessExecutionTime);
      }
    }

    if (action === AutoHealActionType.CustomAction) {
      this.autohealingSettings.autoHealRules.actions.customAction = this.customAction;
    }
    else {
      // reset the custom action if someone switches the tile back and forth
      this.customAction = null;
      this.autohealingSettings.autoHealRules.actions.customAction = null;
    }

    this.autohealingSettings.autoHealRules.actions.actionType = action;
    this.checkForChanges();
  }

  triggerRuleUpdated(ruleEvent, triggerRule: number) {
    switch (triggerRule) {
      case 0: {
        this.autohealingSettings.autoHealRules.triggers.slowRequests = ruleEvent;
        break;
      }
      case 1: {
        this.autohealingSettings.autoHealRules.triggers.privateBytesInKB = ruleEvent;
        break;
      }
      case 2: {
        this.autohealingSettings.autoHealRules.triggers.requests = ruleEvent;
        break;
      }

      case 3: {
        this.autohealingSettings.autoHealRules.triggers.statusCodes = ruleEvent;
        break;
      }
    }

    this.triggers[triggerRule].IsConfigured = this.triggers[triggerRule].checkRuleConfigured();
    this.checkForChanges();
  }

  initTriggersAndActions() {

    this.triggers = [];
    this.actions = [];
    let self = this;

    this.triggers.push({ Name: 'Request Duration', Icon: 'fa fa-hourglass-half', checkRuleConfigured: () => { return self.autohealingSettings != null && self.autohealingSettings.autoHealRules != null && self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.slowRequests != null; }, IsConfigured: false });
    this.triggers.push({ Name: 'Memory Limit', Icon: 'fa fa-microchip', checkRuleConfigured: () => { return self.autohealingSettings != null && self.autohealingSettings.autoHealRules != null && self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.privateBytesInKB > 0 }, IsConfigured: false });
    this.triggers.push({ Name: 'Request Count', Icon: 'fa fa-bar-chart', checkRuleConfigured: () => { return self.autohealingSettings != null && self.autohealingSettings.autoHealRules != null && self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.requests != null; }, IsConfigured: false });
    this.triggers.push({ Name: 'Status Codes', Icon: 'fa fa-list', checkRuleConfigured: () => { return self.autohealingSettings != null && self.autohealingSettings.autoHealRules != null && self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.statusCodes && this.autohealingSettings.autoHealRules.triggers.statusCodes.length > 0 }, IsConfigured: false });

    this.triggers.forEach(triggerRule => {
      triggerRule.IsConfigured = triggerRule.checkRuleConfigured();
    });

    this.actions.push({ Name: 'Recycle Process', Icon: 'fa fa-recycle' });
    this.actions.push({ Name: 'Log an Event', Icon: 'fa fa-book' });
    this.actions.push({ Name: 'Custom Action', Icon: 'fa fa-bolt' });
  }

  updateSummaryText() {
    this.currentSettings = JSON.stringify(this.autohealingSettings);
    this.validateAutoHealRules();
  }

  reset() {
    // Just set the current autoHeal settings to the original one
    this.autohealingSettings = JSON.parse(JSON.stringify(this.originalAutoHealSettings));
    this.updateConditionsAndActions();
    this.checkForChanges();
    this.collapseAllTiles();

  }

  collapseAllTiles(): void {
    //collapse all the tiles
    this.triggerSelected = -1;
    this.actionCollapsed = true;
    this.minProcessExecutionTimeExpanded = false;
  }

  validateAutoHealRules() {
    this.validationWarning = [];

    const minProcessExecutionTimeNotSet: string = "To avoid mitigation actions to kick in immediately after process starts, it is advisable to set the startup time to at least 600 seconds (10 minutes). This will ensure that mitigation actions don't kick in during app's cold start.";
    const actionSetToRecycle: string = "Even though the recyle happens in an overlapped recycling manner, please ensure that the rules configured don't end up recycling your process too many times to avoid any performance hits or app downtimes during cold start of the application.";
    const diagnosticToolChosenCustom: string = "You have chosen a custom action to execute whenever mitigation kicks in.";
    const diagnosticToolChosen: string = " If this is a production app, please ensure that you try these out on a deployment slot first to ensure any downtimes to your application.";
    const memoryRuleChosenWithCustomAction: string = "memoryRuleChosenWithCustomAction";
    const diagnosticJavaToolChosen: string = "The java diagnostic tools use either jMap or jStack process to collect dumps. Both these tools freeze the process while collecting data and the app cannot serve any requests during this time and performance will be impacted. It may take longer to collect these dumps if the process is consuming high memory or has a high number of active threads.";
    const diagnosticMemoryDumpChosen: string = "You have chosen to collect a memory dump of the process. Please note that during the time the memory dump is getting generated, the process is frozen and cannot serve any requests. The amount of time it takes to capture the memory dump depends upon the memory consumption of the process and for processes consuming high memory, it will take longer to generate the dump.";
    const diagnosticProfilerWithThreadStacksChosen: string = "When the profiler is chosen along with thread stacks option, the process is frozen for a few seconds to dump all raw thread stacks. This option is advisable if you are experiencing huge delays (in minutes) to serve the requests or if the application is experiencing deadlocks. During this time, the process cannot serve any requests and application performance will be impacted.";
    const diagnosticProfilerChosen: string = "The profiling tool is light weight but incurs some CPU overhead during the data collection process.";

    if (this.autohealingSettings != null && this.autohealingSettings.autoHealEnabled && this.autohealingSettings.autoHealRules != null && this.autohealingSettings.autoHealRules.actions != null && this.autohealingSettings.autoHealRules.triggers != null) {

      if (FormatHelper.timespanToSeconds(this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime) < 600) {
        this.validationWarning.push(minProcessExecutionTimeNotSet);
      }

      if (this.autohealingSettings.autoHealRules.actions.actionType === AutoHealActionType.Recycle) {
        this.validationWarning.push(actionSetToRecycle);
      }

      if (this.autohealingSettings.autoHealRules.actions.actionType === AutoHealActionType.CustomAction
        && this.autohealingSettings.autoHealRules.actions.customAction != null
        && this.autohealingSettings.autoHealRules.actions.customAction.exe != null) {
        if (this.autohealingSettings.autoHealRules.actions.customAction.exe.toLowerCase() === 'd:\\home\\data\\daas\\bin\\daasconsole.exe') {
          let customActionParam = this.autohealingSettings.autoHealRules.actions.customAction.parameters;

          if (customActionParam.indexOf("\"Memory Dump\"") > 0) {
            this.validationWarning.push(diagnosticMemoryDumpChosen + diagnosticToolChosen);
          }
          else if (customActionParam.indexOf("\"JAVA Memory Dump\"") > 0 || customActionParam.indexOf("\"JAVA Thread Dump\"") > 0) {
            this.validationWarning.push(diagnosticJavaToolChosen + diagnosticToolChosen);
          }
          else if (customActionParam.indexOf("\"CLR Profiler With ThreadStacks\"") > 0) {
            this.validationWarning.push(diagnosticProfilerWithThreadStacksChosen + diagnosticToolChosen)
          }
          else if (customActionParam.indexOf("\"CLR Profiler\"") > 0) {
            this.validationWarning.push(diagnosticProfilerChosen + diagnosticToolChosen)
          }
        }
        else{
          this.validationWarning.push(diagnosticToolChosenCustom + diagnosticToolChosen);
        }
      }

      if (this.autohealingSettings.autoHealRules.actions.actionType === AutoHealActionType.CustomAction
        && this.autohealingSettings.autoHealRules.actions.customAction != null
        && this.autohealingSettings.autoHealRules.actions.customAction.exe != null
        && this.autohealingSettings.autoHealRules.actions.customAction.exe.toLowerCase() === 'd:\\home\\data\\daas\\bin\\daasconsole.exe'
        && this.autohealingSettings.autoHealRules.triggers.privateBytesInKB > 0) {
        this.validationWarning.push(memoryRuleChosenWithCustomAction);
      }

    }
  }
}
