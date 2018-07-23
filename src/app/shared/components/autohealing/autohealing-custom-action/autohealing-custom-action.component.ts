import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
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
  diagnoserOption: string;

  Diagnosers: string[] = ['Memory Dump', 'CLR Profiler', 'CLR Profiler With ThreadStacks', 'JAVA Memory Dump', 'JAVA Thread Dump'];
  DiagnoserOptions: string[] = ['CollectKillAnalyze', 'CollectLogs', 'Troubleshoot'];

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
            this.diagnoserOption = 'Troubleshoot';
            this.updateDaasAction();
          }
        }
      }
    });
  }

  isDiagnosticsConfigured(): boolean {
    if (this.customAction != null) {
      if (this.customAction.exe.endsWith('DaasConsole.exe')) {
        //this.diagnoserName = this.parseDiagnoserFromParams(this.customAction.parameters);
        //this.diagnoserOption = this.parseDiagnoseOptionFromParams(this.customAction.parameters);
        this.diagnoserName = "Memory Dump";
        this.diagnoserOption = 'Troubleshoot';
        this.updateDaasAction(); 
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
    if (this.customActionType == 'Diagnostics') {
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
    autoHealDaasAction.exe = 'D:\\home\\data\DaaS\\bin\\DaasConsole.exe';
    autoHealDaasAction.parameters = `-${this.diagnoserOption} "${this.diagnoserName}"  60`;
    this.customActionChanged.emit(autoHealDaasAction);
  }

  parseDiagnoseOptionFromParams(parameters: string): string {
    let paramArray = parameters.split(' ');
    let diagnoserOption = '';
    if (paramArray.length > 0) {
      diagnoserOption = paramArray[0];

      if (diagnoserOption.startsWith('-')) {
        diagnoserOption = diagnoserOption.substring(1);
      }
    }
    if (this.DiagnoserOptions.indexOf(diagnoserOption) > -1) {
      return diagnoserOption;
    }
    else {
      return "INCORRECT";
    }
  }
  parseDiagnoserFromParams(parameters: string): string {
    let firstQuote = parameters.indexOf('"');
    let secondQuote = parameters.indexOf('"', firstQuote + 1);
    let diagnoserName = '';
    if (secondQuote > firstQuote && secondQuote > 0 && firstQuote > 0) {
      diagnoserName = parameters.substring(firstQuote, secondQuote);
    }
    return diagnoserName;
  }
}
