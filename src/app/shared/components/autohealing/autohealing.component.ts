import { Component, OnInit, Input } from '@angular/core';
import { SiteInfoMetaData } from '../../models/site';
import { AutoHealSettings, AutoHealActions, AutoHealCustomAction, AutoHealTriggers, AutoHealActionType } from '../../models/autohealing';
import { SiteService } from '../../services/site.service';
import { AutohealingService } from '../../services/autohealing.service';
import { FormattingService } from '../../services/formatting.service';

@Component({
  selector: 'autohealing',
  templateUrl: './autohealing.component.html',
  styleUrls: ['./autohealing.component.css']
})
export class AutohealingComponent implements OnInit {

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
  errorMessage: string = '';
  minProcessExecutionTime: number;
  modifyStartupTime: boolean = false;

  constructor(private _siteService: SiteService, private _autohealingService: AutohealingService, private _formattingService: FormattingService) {
  }

  ngOnInit() {

    this._siteService.currentSiteMetaData.subscribe(siteInfo => {
      if (siteInfo) {
        this.siteToBeDiagnosed = siteInfo;
        this._autohealingService.getAutohealSettings(this.siteToBeDiagnosed).subscribe(autoHealSettings => {
          this.retrievingAutohealSettings = false;
          this.autohealingSettings = autoHealSettings;
          this.initComponent(this.autohealingSettings);
        });
      }
    },
      err => {
        this.retrievingAutohealSettings = false;
        this.errorMessage = "Failed while getting AutoHeal settings with error " + JSON.stringify(err);
        this.errorMessage += ". Please retry after some time";
      });
  }

  initComponent(autoHealSettings: AutoHealSettings) {
    this.originalAutoHealSettings = JSON.parse(JSON.stringify(autoHealSettings));
    if (this.autohealingSettings.autoHealRules.actions != null) {
      if (this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime != null){
        this.minProcessExecutionTime = this._formattingService.timespanToSeconds(this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime);
      }
      
      this.actionSelected = this.autohealingSettings.autoHealRules.actions.actionType;
      if (this.autohealingSettings.autoHealRules.actions.actionType === AutoHealActionType.CustomAction) {
        this.customAction = this.autohealingSettings.autoHealRules.actions.customAction;
      }
    }
    this.initTriggersAndActions();
    this.updateSummaryText();
  }

  saveMinProcessTimeChanged() {
    if (this.autohealingSettings.autoHealRules.actions != null) {
      if (this.minProcessExecutionTime != null && this.minProcessExecutionTime != 0){
        this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime = this._formattingService.secondsToTimespan(this.minProcessExecutionTime);
      }
      else {
        this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime = null;
      }
              
      this.modifyStartupTime = false;
      this.checkForChanges();
    }
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
    this.updateSummaryText();
    this.checkForChanges();
  }

  saveChanges() {
    this.saveEnabled = false;
    this.savingAutohealSettings = true;
    this._autohealingService.updateAutohealSettings(this.siteToBeDiagnosed, this.autohealingSettings)
      .subscribe(savedAutoHealSettings => {
        this.savingAutohealSettings = false;
        this.changesSaved = true;
        setTimeout(() => {
          this.changesSaved = false;
        }, 3000);
        this.autohealingSettings = savedAutoHealSettings;

        //collapse both the Trigger and Action tiles
        this.triggerSelected = -1;
        this.actionCollapsed = true;

        this.initComponent(savedAutoHealSettings);
      },
        err => {
          this.savingAutohealSettings = false;
          this.errorMessage = "Failed while saving AutoHeal settings with error " + JSON.stringify(err);
          this.errorMessage += ". Please retry after some time";
        });
  }

  updateTriggerStatus(triggerRule: number) {
    this.actionCollapsed = true;
    if (this.autohealingSettings.autoHealRules.triggers == null) {
      this.autohealingSettings.autoHealRules.triggers = new AutoHealTriggers();
    }
    this.triggerSelected != triggerRule ? this.triggerSelected = triggerRule : this.triggerSelected = -1;
  }

  updateActionStatus(action: number) {

    // collapse the conditions pane
    this.triggerSelected = -1;

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
      if (this.minProcessExecutionTime > 0){
        this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime = this._formattingService.secondsToTimespan( this.minProcessExecutionTime);
      }
    }

    if (action === AutoHealActionType.CustomAction) {
      if (this.customAction == null) {
        let customAction = new AutoHealCustomAction();
        customAction.exe = 'D:\\home\\data\\DaaS\\bin\\DaasConsole.exe';
        customAction.parameters = '-Troubleshoot "Memory Dump"  60';
        this.customAction = customAction;
      }
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

    this.triggers.push({ Name: 'Request Duration', Icon: 'fa fa-clock-o', checkRuleConfigured: () => { return self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.slowRequests != null; }, IsConfigured: false });
    this.triggers.push({ Name: 'Memory Limit', Icon: 'fa fa-microchip', checkRuleConfigured: () => { return self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.privateBytesInKB > 0 }, IsConfigured: false });
    this.triggers.push({ Name: 'Request Count', Icon: 'fa fa-bar-chart', checkRuleConfigured: () => { return self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.requests != null; }, IsConfigured: false });
    this.triggers.push({ Name: 'Status Codes', Icon: 'fa fa-list', checkRuleConfigured: () => { return self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.statusCodes && this.autohealingSettings.autoHealRules.triggers.statusCodes.length > 0 }, IsConfigured: false });

    this.triggers.forEach(triggerRule => {
      triggerRule.IsConfigured = triggerRule.checkRuleConfigured();
    });

    this.actions.push({ Name: 'Recycle Process', Icon: 'fa fa-recycle' });
    this.actions.push({ Name: 'Log an Event', Icon: 'fa fa-book' });
    this.actions.push({ Name: 'Custom Action', Icon: 'fa fa-bolt' });
  }

  updateSummaryText() {
    this.originalSettings = this.getSummary(this.originalAutoHealSettings);
    this.currentSettings = this.getSummary(this.autohealingSettings);
  }

  getSummary(autohealSettingsParameter: AutoHealSettings): any {

    let conditions: string[] = [];
    if (autohealSettingsParameter.autoHealRules.triggers != null) {
      if (autohealSettingsParameter.autoHealRules.triggers.privateBytesInKB > 0) {
        conditions.push("Process consumes more than " + this._formattingService.formatBytes(autohealSettingsParameter.autoHealRules.triggers.privateBytesInKB * 1024, 2) + " private bytes of memory");
      }

      if (autohealSettingsParameter.autoHealRules.triggers.requests != null) {
        conditions.push("App has served  " + autohealSettingsParameter.autoHealRules.triggers.requests.count + " requests in a duration of  " + this._formattingService.timespanToSeconds(autohealSettingsParameter.autoHealRules.triggers.requests.timeInterval) + " seconds");
      }

      if (autohealSettingsParameter.autoHealRules.triggers.slowRequests != null) {
        conditions.push(autohealSettingsParameter.autoHealRules.triggers.slowRequests.count + " requests take more than  " + this._formattingService.timespanToSeconds(autohealSettingsParameter.autoHealRules.triggers.slowRequests.timeTaken) + " seconds in a duration of  " + this._formattingService.timespanToSeconds(autohealSettingsParameter.autoHealRules.triggers.slowRequests.timeInterval) + " seconds");
      }

      if (autohealSettingsParameter.autoHealRules.triggers.statusCodes != null) {
        for (let index = 0; index < autohealSettingsParameter.autoHealRules.triggers.statusCodes.length; index++) {
          let statusCodeRule = autohealSettingsParameter.autoHealRules.triggers.statusCodes[index];
          conditions.push(statusCodeRule.count + " requests end up with HTTP Status  " + statusCodeRule.status + "." + statusCodeRule.subStatus + " and win-32 status  " + statusCodeRule.win32Status + " in a duration of  " + this._formattingService.timespanToSeconds(statusCodeRule.timeInterval) + " seconds");
        }

      }
    }

    let action: string = '';
    let actionExe: string = '';
    if (conditions.length > 0 && autohealSettingsParameter.autoHealRules.actions != null) {
      if (autohealSettingsParameter.autoHealRules.actions.actionType === AutoHealActionType.Recycle) {
        action = "Recycle the process";
      }
      else if (autohealSettingsParameter.autoHealRules.actions.actionType === AutoHealActionType.LogEvent) {
        action = "Log an Event in the Event Viewer";
      }

      else if (autohealSettingsParameter.autoHealRules.actions.actionType === AutoHealActionType.CustomAction) {
        action = "Run executable ";
        if (autohealSettingsParameter.autoHealRules.actions.customAction != null && autohealSettingsParameter.autoHealRules.actions.customAction.exe != null && autohealSettingsParameter.autoHealRules.actions.customAction.parameters != null) {
          actionExe = autohealSettingsParameter.autoHealRules.actions.customAction.exe + " " + autohealSettingsParameter.autoHealRules.actions.customAction.parameters;
        }      
      }
      if (autohealSettingsParameter.autoHealRules.actions != null && autohealSettingsParameter.autoHealRules.actions.minProcessExecutionTime != null) {
        let seconds = this._formattingService.timespanToSeconds(autohealSettingsParameter.autoHealRules.actions.minProcessExecutionTime);
        if (seconds > 0){
          action = action + ` after ${seconds} seconds of process start`        
        }
      }
    }

    return { Action: action, ActionExe: actionExe, Conditions: conditions };
  }

}
