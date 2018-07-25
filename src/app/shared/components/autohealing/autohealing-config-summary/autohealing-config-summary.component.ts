import { Component, OnInit, OnChanges, Input } from '@angular/core';
import { AutoHealSettings, AutoHealActionType } from '../../../models/autohealing';
import { FormatHelper } from '../../../utilities/formattingHelper';

@Component({
  selector: 'autohealing-config-summary',
  templateUrl: './autohealing-config-summary.component.html',
  styleUrls: ['./autohealing-config-summary.component.css']
})
export class AutohealingConfigSummaryComponent implements OnInit, OnChanges {

  constructor() { }

  @Input() autohealSettings: string;
  initialized: boolean = false;

  ngOnInit() {
    if (this.initialized === false){
      this.updateComponent();
      this.initialized = true;
    }    
  }

  ngOnChanges() {
    this.updateComponent();
  }

  actualhealSettings: AutoHealSettings;
  processStartupLabel: string = "";
  settingsSummary: any;

  updateComponent() {

    if (this.autohealSettings == null) {
      return;      
    }

    this.actualhealSettings = JSON.parse(this.autohealSettings);
    this.settingsSummary = {};
    let conditions: string[] = [];
    if (this.actualhealSettings.autoHealRules.triggers != null) {
      if (this.actualhealSettings.autoHealRules.triggers.privateBytesInKB > 0) {
        conditions.push("Process consumes more than " + FormatHelper.formatBytes(this.actualhealSettings.autoHealRules.triggers.privateBytesInKB * 1024, 2) + " private bytes of memory");
      }

      if (this.actualhealSettings.autoHealRules.triggers.requests != null) {
        conditions.push("App has served  " + this.actualhealSettings.autoHealRules.triggers.requests.count + " requests in a duration of  " + FormatHelper.timespanToSeconds(this.actualhealSettings.autoHealRules.triggers.requests.timeInterval) + " seconds");
      }

      if (this.actualhealSettings.autoHealRules.triggers.slowRequests != null) {
        conditions.push(this.actualhealSettings.autoHealRules.triggers.slowRequests.count + " requests take more than  " + FormatHelper.timespanToSeconds(this.actualhealSettings.autoHealRules.triggers.slowRequests.timeTaken) + " seconds in a duration of  " + FormatHelper.timespanToSeconds(this.actualhealSettings.autoHealRules.triggers.slowRequests.timeInterval) + " seconds");
      }

      if (this.actualhealSettings.autoHealRules.triggers.statusCodes != null) {
        for (let index = 0; index < this.actualhealSettings.autoHealRules.triggers.statusCodes.length; index++) {
          let statusCodeRule = this.actualhealSettings.autoHealRules.triggers.statusCodes[index];
          conditions.push(statusCodeRule.count + " requests end up with HTTP Status  " + statusCodeRule.status + "." + statusCodeRule.subStatus + " and win-32 status  " + statusCodeRule.win32Status + " in a duration of  " + FormatHelper.timespanToSeconds(statusCodeRule.timeInterval) + " seconds");
        }

      }
    }

    let action: string = "";
    let actionExe: string = "";
    this.processStartupLabel = "";
    if (conditions.length > 0 && this.actualhealSettings.autoHealRules.actions != null) {
      if (this.actualhealSettings.autoHealRules.actions.actionType === AutoHealActionType.Recycle) {
        action = "Recycle the process";
      }
      else if (this.actualhealSettings.autoHealRules.actions.actionType === AutoHealActionType.LogEvent) {
        action = "Log an Event in the Event Viewer";
      }

      else if (this.actualhealSettings.autoHealRules.actions.actionType === AutoHealActionType.CustomAction) {
        action = "Run executable ";
        if (this.actualhealSettings.autoHealRules.actions.customAction != null && this.actualhealSettings.autoHealRules.actions.customAction.exe != null && this.actualhealSettings.autoHealRules.actions.customAction.parameters != null) {
          actionExe = this.actualhealSettings.autoHealRules.actions.customAction.exe + " " + this.actualhealSettings.autoHealRules.actions.customAction.parameters;
        }
      }
      if (this.actualhealSettings.autoHealRules.actions != null && this.actualhealSettings.autoHealRules.actions.minProcessExecutionTime != null) {
        let seconds = FormatHelper.timespanToSeconds(this.actualhealSettings.autoHealRules.actions.minProcessExecutionTime);
        if (seconds > 0) {
          this.processStartupLabel = ` after ${seconds} seconds of process startup`;
        }
      }
    }

    this.settingsSummary = { Action: action, ActionExe: actionExe, Conditions: conditions, ProcessStartupLabel: this.processStartupLabel };
  }
}
