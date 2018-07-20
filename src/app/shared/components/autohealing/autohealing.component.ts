import { Component, OnInit, Input } from '@angular/core';
import { SiteInfoMetaData } from '../../models/site';
import { AutoHealSettings, AutoHealActions, AutoHealCustomAction, AutoHealTriggers } from '../../models/autohealing';
import { SiteService } from '../../services/site.service';
import { AutohealingService } from '../../services/autohealing.service';
import { SiteDaasInfo } from '../../models/solution-metadata';

@Component({
  selector: 'autohealing',
  templateUrl: './autohealing.component.html',
  styleUrls: ['./autohealing.component.css']
})
export class AutohealingComponent implements OnInit {


  siteToBeDiagnosed: SiteInfoMetaData;

  @Input()
  autohealingSettings: AutoHealSettings;

  retrievingAutohealSettings: boolean = true;
  savingAutohealSettings: boolean = false;
  triggerSelected: number = -1;
  actionSelected: number = -1;
  actionCollapsed: boolean = false;

  originalAutoHealSettings: string = '';
  saveEnabled: boolean = false;
  changesSaved: boolean = false;
  triggers = [];
  actions = [];
  summaryText: string = '';
  daasCustomAction: AutoHealCustomAction = null;

  constructor(private _siteService: SiteService, private _autohealingService: AutohealingService) {

  }

  ngOnInit() {

    this._siteService.currentSiteMetaData.subscribe(siteInfo => {
      if (siteInfo) {
        this.siteToBeDiagnosed = siteInfo;
        this._autohealingService.getAutohealSettings(this.siteToBeDiagnosed).subscribe(autoHealSettings => {
          this.autohealingSettings = autoHealSettings;
          this.originalAutoHealSettings = JSON.stringify(this.autohealingSettings);
          this.retrievingAutohealSettings = false;

          if (this.autohealingSettings.autoHealRules.actions) {
            this.actionSelected = this.autohealingSettings.autoHealRules.actions.actionType;
          }

          this.initTriggers();
        });
      }
    });
  }


  checkForChanges() {
    if (this.originalAutoHealSettings != JSON.stringify(this.autohealingSettings)) {
      this.saveEnabled = true;
    }
    else {
      this.saveEnabled = false;
    }
    this.updateSummaryText();
  }

  updateDaasAction(action: AutoHealCustomAction) {
    this.daasCustomAction = action;
    this.autohealingSettings.autoHealRules.actions.customAction = this.daasCustomAction;
    this.updateSummaryText();
  }

  saveChanges() {
    this.saveEnabled = false;
    this.savingAutohealSettings = true;
    this.triggerSelected = -1;
    this.actionSelected = -1;
    this._autohealingService.updateAutohealSettings(this.siteToBeDiagnosed, this.autohealingSettings)
      .subscribe(x => {
        console.log("Got Response " + x);
        this.savingAutohealSettings = false;
        this.originalAutoHealSettings = JSON.stringify(this.autohealingSettings);
        this.changesSaved = true;
        setTimeout(() => {
          this.changesSaved = false;
        }, 3000)
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
    }

    if (action == 2) {
      if (this.daasCustomAction != null) {
        this.autohealingSettings.autoHealRules.actions.customAction = this.daasCustomAction;
      }
    }

    if (action == 3) {
      if (this.autohealingSettings.autoHealRules.actions.customAction != null) {
        this.autohealingSettings.autoHealRules.actions.customAction = new AutoHealCustomAction();
        this.autohealingSettings.autoHealRules.actions.customAction.exe = 'D:\\home\\data\DaaS\\bin\\DaasConsole.exe';
        this.autohealingSettings.autoHealRules.actions.customAction.parameters = '-CollectKillAnalyze "Memory Dump" 60';
      }
    }

    //for both the DAAS Action and Custom Action, the actionType is 2 which is customAction
    let autoHealAction = action > 2 ? action - 1 : action;
    this.autohealingSettings.autoHealRules.actions.actionType = autoHealAction;
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

    this.triggers[triggerRule].IsConfigured = this.checkRuleConfigured(triggerRule);
    this.checkForChanges();
  }

  checkRuleConfigured(triggerRule: number): boolean {
    if (this.autohealingSettings.autoHealRules.triggers == null) {
      return false;
    }

    let isConfigured: boolean = false;
    switch (triggerRule) {
      case 0: {
        isConfigured = this.autohealingSettings.autoHealRules.triggers.slowRequests != null;
        break;
      }
      case 1: {
        isConfigured = this.autohealingSettings.autoHealRules.triggers.privateBytesInKB > 0;
        break;
      }
      case 2: {
        isConfigured = this.autohealingSettings.autoHealRules.triggers.requests != null;
        break;
      }

      case 3: {
        isConfigured = this.autohealingSettings.autoHealRules.triggers.statusCodes && this.autohealingSettings.autoHealRules.triggers.statusCodes.length > 0;
        break;
      }
    }

    return isConfigured;
  }

  initTriggers() {

    let triggersConfigured = this.autohealingSettings.autoHealRules.triggers != null;

    this.triggers.push({ Name: 'Slow Requests', Icon: 'fa fa-clock-o', IsConfigured: triggersConfigured && this.checkRuleConfigured(0) });
    this.triggers.push({ Name: 'Memory Limit', Icon: 'fa fa-microchip', IsConfigured: triggersConfigured && this.checkRuleConfigured(1) });
    this.triggers.push({ Name: 'Request Count', Icon: 'fa fa-bar-chart', IsConfigured: triggersConfigured && this.checkRuleConfigured(2) });
    this.triggers.push({ Name: 'Status Codes', Icon: 'fa fa-list', IsConfigured: triggersConfigured && this.checkRuleConfigured(3) });

    this.actions.push({ Name: 'Recycle Process', Icon: 'fa fa-recycle' });
    this.actions.push({ Name: 'Log an Event', Icon: 'fa fa-book' });
    this.actions.push({ Name: 'Run Diagnostics', Icon: 'fa fa-wrench' });
    this.actions.push({ Name: 'Custom Action', Icon: 'fa fa-bolt' });

  }


  updateSummaryText() {
    this.summaryText = "";
    let summary: string[] = [];

    if (this.autohealingSettings.autoHealRules.triggers != null) {
      if (this.autohealingSettings.autoHealRules.triggers.privateBytesInKB > 0) {
        summary.push("process consumes more than " + this.formatBytes(this.autohealingSettings.autoHealRules.triggers.privateBytesInKB, 2) + " private bytes of memory");
      }

      if (this.autohealingSettings.autoHealRules.triggers.requests != null) {
        summary.push("app has served  " + this.autohealingSettings.autoHealRules.triggers.requests.count + " requests in a duration of  " + this._autohealingService.timeToSeconds(this.autohealingSettings.autoHealRules.triggers.requests.timeInterval) + " seconds");
      }

      if (this.autohealingSettings.autoHealRules.triggers.slowRequests != null) {
        summary.push(this.autohealingSettings.autoHealRules.triggers.slowRequests.count + " requests took more than  " + this._autohealingService.timeToSeconds(this.autohealingSettings.autoHealRules.triggers.slowRequests.timeTaken) + " seconds in a duration of  " + this._autohealingService.timeToSeconds(this.autohealingSettings.autoHealRules.triggers.slowRequests.timeInterval) + " seconds");
      }

      if (this.autohealingSettings.autoHealRules.triggers.statusCodes != null) {
        for (let index = 0; index < this.autohealingSettings.autoHealRules.triggers.statusCodes.length; index++) {
          let statusCodeRule = this.autohealingSettings.autoHealRules.triggers.statusCodes[index];
          summary.push(statusCodeRule.count + " requests end up with HTTP Status  " + statusCodeRule.status + "." + statusCodeRule.subStatus + " and win-32 status  " + statusCodeRule.win32Status + " in a duration of  " + this._autohealingService.timeToSeconds(statusCodeRule.timeInterval) + " seconds");
        }

      }
    }

    if (summary.length > 0) {
      this.summaryText = summary.join(' or ');
      this.summaryText = "When " + this.summaryText + ", ";

      if (this.autohealingSettings.autoHealRules.actions.actionType == 0) {
        this.summaryText += " recycle the process.";
      }
      else if (this.autohealingSettings.autoHealRules.actions.actionType == 1) {
        this.summaryText += " log an Event in the Event Viewer.";
      }

      else if (this.autohealingSettings.autoHealRules.actions.actionType == 2) {
        this.summaryText += " run an executable (" + this.autohealingSettings.autoHealRules.actions.customAction.exe + ") with parameters (" + this.autohealingSettings.autoHealRules.actions.customAction.parameters + ")";
      }


    }
    else {
      this.summaryText = "Found no auto-heal rules configured"
    }
  }

  formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Bytes';
    var k = 1024,
      dm = decimals || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }


}
