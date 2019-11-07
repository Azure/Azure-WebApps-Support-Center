import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild } from '@angular/core';
import { ServerFarmDataService } from '../../shared/services/server-farm-data.service';
import { SiteService } from '../../shared/services/site.service';
import { SiteInfoMetaData } from '../../shared/models/site';
import { AutoHealCustomAction } from '../../shared/models/autohealing';
import { DaasService } from '../../shared/services/daas.service';
import { DaasValidatorComponent } from '../../shared/components/daas/daas-validator.component';
import { StorageAccountValidationResult } from '../../shared/models/daas';

@Component({
  selector: 'autohealing-custom-action',
  templateUrl: './autohealing-custom-action.component.html',
  styleUrls: ['./autohealing-custom-action.component.scss', '../autohealing.component.scss']
})
export class AutohealingCustomActionComponent implements OnInit, OnChanges {

  constructor(private _serverFarmService: ServerFarmDataService, private _siteService: SiteService, private _daasService: DaasService) {
  }

  @ViewChild('daasValidatorRef') daasValidatorRef:DaasValidatorComponent;

  @Input() siteToBeDiagnosed: SiteInfoMetaData;
  @Input() customAction: AutoHealCustomAction;
  @Output() customActionChanged: EventEmitter<AutoHealCustomAction> = new EventEmitter<AutoHealCustomAction>();

  diagnoser: any = null;
  diagnoserOption: any = null;
  showDiagnoserOptionWarning: boolean = false;
  validationResult:StorageAccountValidationResult = new StorageAccountValidationResult();

  Diagnosers = [{ Name: 'Memory Dump', Description: 'Collects memory dumps of the process and the child processes hosting your app and analyzes them for errors' },
  { Name: 'CLR Profiler', Description: 'Profiles ASP.NET application code to identify exceptions and performance issues' },
  { Name: 'CLR Profiler With Thread Stacks', Description: 'Profiles ASP.NET application code to identify exceptions and performance issues and dumps stacks to identify deadlocks' },
  { Name: 'JAVA Memory Dump', Description: 'Collects a binary memory dump using jMap of all java.exe processes running for this web app' },
  { Name: 'JAVA Thread Dump', Description: 'Collects jStack output of all java.exe processes running for this app and analyzes the same' }];
  DiagnoserOptions = [
    { option: 'CollectKillAnalyze', Description: 'With this option, the above selected tool\'s data will collected, analyzed and the process will be recycled.' },
    { option: 'CollectLogs', Description: 'With this option, only the above selected tool\'s data will collected. No analysis will be performed and process will not be restarted.' },
    { option: 'Troubleshoot', Description: 'With this option, the above selected tool\'s data will collected and then analyzed. This will not cause the process to restart. ' }
  ];
  customActionType: string = 'Diagnostics';
  customActionParams: string = '';
  customActionExe: string = '';

  ngOnChanges() {
    this.initComponent();
  }

  ngOnInit() {
    this.initComponent();
    // This is required in case someone lands on Mitigate page
    // without ever hitting DAAS endpoint. Browsing to any DAAS
    // endpoint, will ensure that DaaSConsole is copied to the
    // right folders and will allow autohealing to work correctly
    this.makeDaasWarmupCall();
  }

  makeDaasWarmupCall(): any {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(siteDaasInfo => {
      this._daasService.getInstances(siteDaasInfo).subscribe(resp => {
        //do nothing with resp
      });
    });

  }
  initComponent() {
    if (this.customAction == null) {
      this.customAction = new AutoHealCustomAction();
      this.customAction.exe = 'D:\\home\\data\\DaaS\\bin\\DaasConsole.exe';
      this.diagnoserOption = this.DiagnoserOptions[0];
      this.diagnoser = this.Diagnosers[0];
      this.customAction.parameters = `-${this.diagnoserOption.option} "${this.diagnoser.Name}"  60`;
      return;
    }

    if (this.customActionType === 'Diagnostics') {
      const diagnosticsConfiguredCorrectly = this.isDiagnosticsConfigured();
      if (!diagnosticsConfiguredCorrectly) {
        this.initDiagnosticsIfRequired();
      }
    }

  }

  saveCustomAction() {
    if (this.customActionType === 'Diagnostics') {
      this.updateDaasAction();
    } else {
      this.updateCustomAction();
    }
  }

  initDiagnosticsIfRequired() {
    if (this.diagnoser == null) {
      this.diagnoser = this.Diagnosers[0];
    }

    if (this.diagnoserOption == null) {
      this.diagnoserOption = this.DiagnoserOptions[0];
    }
  }

  isDiagnosticsConfigured(): boolean {
    let invalidSetting = false;
    if (this.customAction != null) {
      if (this.customAction.exe.toLowerCase() === 'd:\\home\\data\\daas\\bin\\daasconsole.exe') {
        this.customActionType = 'Diagnostics';
        if (this.customAction.parameters !== '') {
          invalidSetting = this.getDiagnoserNameAndOptionFromParameter(this.customAction.parameters);
        }
        if (invalidSetting) {
          this.initDiagnosticsIfRequired();
        }
      } else {
        this.customActionType = 'Custom';
        this.customActionExe = this.customAction.exe;
        this.customActionParams = this.customAction.parameters;
      }
      return true;
    } else {
      return false;
    }
  }

  chooseDiagnoser(val) {
    this.diagnoser = val;
    this.daasValidatorRef.diagnoserName = this.diagnoser.Name;
    this.daasValidatorRef.checkStorageRequirementForDiagnoser();
  }

  chooseDiagnoserAction(val) {
    this.diagnoserOption = val;
    if (this.diagnoserOption.option !== 'CollectKillAnalyze') {
      this.showDiagnoserOptionWarning = true;
    } else {
      this.showDiagnoserOptionWarning = false;
    }

  }

  updateCustomActionExe(exe: string) {
    this.customActionExe = exe;

  }
  updateCustomActionParams(params: string) {
    this.customActionParams = params;

  }
  updateCustomAction() {
    const autoHealCustomAction = new AutoHealCustomAction();
    autoHealCustomAction.exe = this.customActionExe;
    autoHealCustomAction.parameters = this.customActionParams;
    this.customActionChanged.emit(autoHealCustomAction);
  }

  updateDaasAction() {
    if (this.validationResult.Validated) {
      const autoHealDaasAction = new AutoHealCustomAction();
      autoHealDaasAction.exe = 'D:\\home\\data\\DaaS\\bin\\DaasConsole.exe';
      autoHealDaasAction.parameters = `-${this.diagnoserOption.option} "${this.diagnoser.Name}"  60`;
      this.customActionChanged.emit(autoHealDaasAction);
    } else {
      const emptyAction = new AutoHealCustomAction();
      emptyAction.exe = '';
      emptyAction.parameters = '';
      this.customActionChanged.emit(emptyAction);
    }
  }

  getDiagnoserNameAndOptionFromParameter(param: string): boolean {
    let invalidSetting = true;
    const paramArray = param.split(' ');
    let diagnoserOption = paramArray[0];
    if (diagnoserOption.startsWith('-')) {
      diagnoserOption = diagnoserOption.substring(1);

      const diagnoserOptionIndex = this.DiagnoserOptions.findIndex(item => item.option === diagnoserOption);
      if (diagnoserOptionIndex > -1) {
        this.diagnoserOption = this.DiagnoserOptions[diagnoserOptionIndex];
        if (this.diagnoserOption.option !== 'CollectKillAnalyze') {
          this.showDiagnoserOptionWarning = true;
        } else {
          this.showDiagnoserOptionWarning = false;
        }
        const firstQuote = param.indexOf('"');
        const secondQuote = param.indexOf('"', firstQuote + 1);
        let diagnoserName = '';
        if (secondQuote > firstQuote && secondQuote > 0 && firstQuote > 0) {
          diagnoserName = param.substring(firstQuote + 1, secondQuote);
          const diagnoserIndex = this.Diagnosers.findIndex(item => item.Name === diagnoserName);
          if (diagnoserIndex > -1) {
            this.diagnoser = this.Diagnosers[diagnoserIndex];
            invalidSetting = false;
          }
        }
      }
    }
    return invalidSetting;
  }

  onDaasValidated(event: StorageAccountValidationResult) {
    this.validationResult = event;
  }
}
