import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DiagnoserDefinition } from '../../../models/daas';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { ServerFarmDataService } from '../../../services/server-farm-data.service';
import { DaasService } from '../../../services/daas.service';
import { SiteInfoMetaData } from '../../../models/site';
import { AutoHealCustomAction } from '../../../models/autohealing';

@Component({
  selector: 'autohealing-daas-action',
  templateUrl: './autohealing-daas-action.component.html',
  styleUrls: ['./autohealing-daas-action.component.css']
})
export class AutohealingDaasActionComponent implements OnInit {

  constructor(private _serverFarmService: ServerFarmDataService, private _daasService: DaasService) {

  }

  @Input() siteToBeDiagnosed: SiteInfoMetaData;

  @Output() DaasAction: EventEmitter<AutoHealCustomAction> = new EventEmitter<AutoHealCustomAction>();

  checkingSupportedTier: boolean = true;
  supportedTier: boolean = true;
  retrievingDiagnosers: boolean = true;
  siteDaasInfo: SiteDaasInfo;
  diagnoserName: string;
  diagnoserOption: string;
  Diagnosers:DiagnoserDefinition[] = [];

  ngOnInit() {
    this.initSiteDaasInfo();
    this._serverFarmService.siteServerFarm.subscribe(serverFarm => {
      if (serverFarm) {
        this.checkingSupportedTier = false;
        if (serverFarm.sku.tier === "Standard" || serverFarm.sku.tier === "Basic" || serverFarm.sku.tier.indexOf("Premium") > -1 || serverFarm.sku.tier === "Isolated") {
          this.supportedTier = true;

          this.retrievingDiagnosers = true;
          this._daasService.getDiagnosers(this.siteDaasInfo).retry(2)
            .subscribe(result => {
              this.retrievingDiagnosers = false;
              this.Diagnosers = result.filter(x=>x.Warnings.length == 0);
              this.Diagnosers = this.Diagnosers.filter(x=>!x.Name.startsWith('Event Viewer') && !x.Name.startsWith('PHP') && !x.Name.startsWith('Http '));
              if (this.Diagnosers.length > 0){
                this.diagnoserName = this.Diagnosers[0].Name;                
              }
              this.diagnoserOption = 'Troubleshoot';
              this.updateDaasAction();
            });

        }
      }
    });
  }

  initSiteDaasInfo() {
    this.siteDaasInfo = new SiteDaasInfo();
    this.siteDaasInfo.resourceGroupName = this.siteToBeDiagnosed.resourceGroupName;
    this.siteDaasInfo.resourceUri = this.siteToBeDiagnosed.resourceUri;
    this.siteDaasInfo.siteName = this.siteToBeDiagnosed.siteName;
    this.siteDaasInfo.slot = this.siteToBeDiagnosed.slot;
    this.siteDaasInfo.subscriptionId = this.siteToBeDiagnosed.subscriptionId;
    this.siteDaasInfo.instances = [];
  }

  chooseDiagnoser(val) {
    this.diagnoserName = val;
    this.updateDaasAction();
  }

  chooseDiagnoserAction(val) {
    this.diagnoserOption = val;
    this.updateDaasAction();
  }

  updateDaasAction() {
    let autoHealDaasAction = new AutoHealCustomAction();
    autoHealDaasAction.exe = 'D:\\home\\data\DaaS\\bin\\DaasConsole.exe';
    autoHealDaasAction.parameters = `-${this.diagnoserOption} "${this.diagnoserName}"  60`;
    this.DaasAction.emit(autoHealDaasAction);
  }
}
