import { Component, OnInit, Input } from '@angular/core';
import { SiteInfoMetaData } from '../../models/site';
import { AutoHealSettings, AutoHealActions, AutoHealCustomAction, AutoHealTriggers, AutoHealActionType } from '../../models/autohealing';
import { SiteService } from '../../services/site.service';
import { AutohealingService } from '../../services/autohealing.service';
import { FormatHelper } from '../../utilities/formattingHelper';

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
  errorMessage: string = "";
  minProcessExecutionTime: number;
  minProcessExecutionTimeExpanded: boolean = false;

  constructor(private _siteService: SiteService, private _autohealingService: AutohealingService) {
  }

  ngOnInit() {
    this._siteService.currentSiteMetaData.subscribe(siteInfo => {
      if (siteInfo) {
        this.siteToBeDiagnosed = siteInfo;
        this._autohealingService.getAutohealSettings(this.siteToBeDiagnosed).subscribe(autoHealSettings => {
          this.retrievingAutohealSettings = false;
          this.autohealingSettings = autoHealSettings;
          this.initComponent(this.autohealingSettings);
        },
        err => {
          this.retrievingAutohealSettings = false;
          this.errorMessage = `Failed with an error ${err} while retrieving autoheal settings`;
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
    if (this.autohealingSettings.autoHealRules.actions != null) {
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
    this.saveEnabled = false;
    this.savingAutohealSettings = true;
    this._autohealingService.updateAutohealSettings(this.siteToBeDiagnosed, this.autohealingSettings)
      .subscribe(savedAutoHealSettings => {
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
          this.errorMessage = "Failed while saving AutoHeal settings with error :" + err;
          this.errorMessage += ". Please retry after some time";
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

    this.triggers.push({ Name: 'Request Duration', Icon: 'fa fa-hourglass-half', checkRuleConfigured: () => { return self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.slowRequests != null; }, IsConfigured: false });
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
    this.currentSettings = JSON.stringify(this.autohealingSettings);
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
}
