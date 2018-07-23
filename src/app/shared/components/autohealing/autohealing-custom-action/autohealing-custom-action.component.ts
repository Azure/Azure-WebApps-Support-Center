import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ServerFarmDataService } from '../../../services/server-farm-data.service';
import { DaasService } from '../../../services/daas.service';
import { SiteInfoMetaData } from '../../../models/site';
import { AutoHealCustomAction } from '../../../models/autohealing';

@Component({
  selector: 'autohealing-custom-action',
  templateUrl: './autohealing-custom-action.component.html',
  styleUrls: ['./autohealing-custom-action.component.css']
})
export class AutohealingCustomActionComponent implements OnInit {

  constructor(private _serverFarmService: ServerFarmDataService, private _daasService: DaasService) {
  }

  @Input() siteToBeDiagnosed: SiteInfoMetaData;
  @Input() customAction: AutoHealCustomAction;
  @Output() customActionChanged: EventEmitter<AutoHealCustomAction> = new EventEmitter<AutoHealCustomAction>();

  checkingSupportedTier: boolean = true;
  supportedTier: boolean = true;

  diagnoserName: string;
  diagnoserOption: any = [ { option:"", Description :"" }];

  Diagnosers: string[] = ['Memory Dump', 'CLR Profiler', 'CLR Profiler With ThreadStacks', 'JAVA Memory Dump', 'JAVA Thread Dump'];
  DiagnoserOptions = [ 
                    {option:'CollectKillAnalyze', Description : "With this option, the selected tool's data will collected, analyzed and after the collection is finished, the process will be recycled."}, 
                    {option:'CollectLogs', Description : "With this option, only the selected tool's data will collected. No analysis will be performed and process will not be restarted as a part of this option."},
                    {option: 'Troubleshoot', Description : "With this option, the selected tool's data will collected and then analyzed. This will not cause the process to restart. "}
                  ];
  customActionType: string = 'Diagnostics';
  customActionParams: string = '';
  customActionExe: string = '';

  ngOnInit() {

    this._serverFarmService.siteServerFarm.subscribe(serverFarm => {
      if (serverFarm) {
        this.checkingSupportedTier = false;
        if (serverFarm.sku.tier === "Standard" || serverFarm.sku.tier === "Basic" || serverFarm.sku.tier.indexOf("Premium") > -1 || serverFarm.sku.tier === "Isolated") {
          this.supportedTier = true;
          let diagnosticsConfiguredAlready = this.isDiagnosticsConfigured();
          if (!diagnosticsConfiguredAlready) {
            this.diagnoserName = "Memory Dump";
            this.diagnoserOption = this.DiagnoserOptions[2];
            this.updateDaasAction();
          }
        }
      }
    });
  }

  isDiagnosticsConfigured(): boolean {
    let invalidSetting = false;
    if (this.customAction != null) {
      if (this.customAction.exe.toLowerCase() === 'd:\\home\\data\\daas\\bin\\daasconsole.exe') {

        if (this.customAction.parameters !== '') {
          invalidSetting = this.getDiagnoserNameAndOptionFromParameter(this.customAction.parameters);
        }
        if (invalidSetting) {
          this.diagnoserName = "Memory Dump";
          this.diagnoserOption = this.DiagnoserOptions[2];
          this.updateDaasAction();
        }

      }
      else {
        this.customActionType = 'Custom';
        this.customActionExe = this.customAction.exe;
        this.customActionParams = this.customAction.parameters;
        this.updateCustomAction();
      }
      return true;
    }
    else {
      return false;
    }
  }

  chooseDiagnoser(val) {
    this.diagnoserName = val;
    this.updateDaasAction();
  }

  chooseDiagnoserAction(val) {
    this.diagnoserOption = val;
    this.updateDaasAction();
  }

  updateCustomActionType() {
    if (this.customActionType === 'Diagnostics') {
      this.updateDaasAction();
    }
    else {
      this.updateCustomAction();
    }
  }

  updateCustomAction() {
    let autoHealCustomAction = new AutoHealCustomAction();
    autoHealCustomAction.exe = this.customActionExe
    autoHealCustomAction.parameters = this.customActionParams;
    this.customActionChanged.emit(autoHealCustomAction);
  }

  updateDaasAction() {
    let autoHealDaasAction = new AutoHealCustomAction();
    autoHealDaasAction.exe = 'D:\\home\\data\\DaaS\\bin\\DaasConsole.exe';
    autoHealDaasAction.parameters = `-${this.diagnoserOption.option} "${this.diagnoserName}"  60`;
    this.customActionChanged.emit(autoHealDaasAction);
  }

  getDiagnoserNameAndOptionFromParameter(param: string): boolean {
    let invalidSetting = true;;
    let paramArray = param.split(' ');
    let diagnoserOption = paramArray[0];
    if (diagnoserOption.startsWith('-')) {
      diagnoserOption = diagnoserOption.substring(1);

      let diagnoserOptionIndex = this.DiagnoserOptions.findIndex(item => item.option === diagnoserOption)
      if (diagnoserOptionIndex > -1) {
        this.diagnoserOption = this.DiagnoserOptions[diagnoserOptionIndex];
        let firstQuote = param.indexOf('"');
        let secondQuote = param.indexOf('"', firstQuote + 1);
        let diagnoserName = '';
        if (secondQuote > firstQuote && secondQuote > 0 && firstQuote > 0) {
          diagnoserName = param.substring(firstQuote + 1, secondQuote);
          if (this.Diagnosers.indexOf(diagnoserName) > -1) {
            this.diagnoserName = diagnoserName;
            invalidSetting = false;
          }
        }
      }
    }
    return invalidSetting;
  }
}
