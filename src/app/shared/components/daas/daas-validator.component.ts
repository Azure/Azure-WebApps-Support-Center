import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ServerFarmDataService } from '../../services/server-farm-data.service';
import { DaasService } from '../../services/daas.service';
import { SiteDaasInfo } from '../../models/solution-metadata';
import { DiagnoserDefinition } from '../../models/daas';
import { Observable } from 'rxjs/Observable';
import { SiteService } from '../../services/site.service';

@Component({
  selector: 'daas-validator',
  templateUrl: './daas-validator.component.html'
})
export class DaasValidatorComponent implements OnInit {

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() diagnoserName: string;

  @Output() DaasValidated: EventEmitter<boolean> = new EventEmitter<boolean>();

  supportedTier: boolean = false;
  diagnoserWarning: string = "";
  daasRunnerJobRunning: boolean = true;
  checkingDaasWebJobStatus: boolean = false;
  checkingSupportedTier: boolean = true;
  foundDiagnoserWarnings: boolean = false;
  alwaysOnEnabled: boolean = true;
  error: string = "";

  constructor(private _serverFarmService: ServerFarmDataService, private _siteService: SiteService, private _daasService: DaasService) {
  }

  validateDaasSettings() {
    this.error = "";
    this.supportedTier = false;
    this.diagnoserWarning = "";
    this.daasRunnerJobRunning = true;
    this.checkingDaasWebJobStatus = false;
    this.checkingSupportedTier = true;
    this.foundDiagnoserWarnings = false;

    Observable.combineLatest(
      this._serverFarmService.siteServerFarm,
      this._siteService.getAlwaysOnSetting(this.siteToBeDiagnosed),
      this._daasService.getDiagnosers(this.siteToBeDiagnosed).retry(2),
    ).subscribe(results => {
      this.checkingSupportedTier = false;
      let serverFarm = results[0];
      this.alwaysOnEnabled = results[1];
      let diagnosers: DiagnoserDefinition[] = results[2];
      if (serverFarm.sku.tier === "Standard" || serverFarm.sku.tier.indexOf("Premium") > -1 || serverFarm.sku.tier === "Isolated") {
        this.supportedTier = true;
      }
      else {
        return;
      }

      if (!this.alwaysOnEnabled) {
        return;
      }

      let thisDiagnoser = diagnosers.find(x => x.Name === this.diagnoserName);
      if (thisDiagnoser) {
        if (thisDiagnoser.Warnings.length > 0) {
          this.diagnoserWarning = thisDiagnoser.Warnings.join(',');
          this.foundDiagnoserWarnings = true;
          return;
        }
      }

      if (!this.foundDiagnoserWarnings) {
        this.checkDaasWebjobState();
      }
    }, err => {
      this.checkingSupportedTier = false;
      this.error = `Failed with an error ${JSON.stringify(err)} while retrieving site and DaaS settings`;
    });

  }

  ngOnInit(): void {
    this.validateDaasSettings();
  }

  checkDaasWebjobState() {

    this.checkingDaasWebJobStatus = true;
    let retryCount: number = 0;
    this._daasService.getDaasWebjobState(this.siteToBeDiagnosed)
      .map(webjobstate => {
        if (webjobstate !== "Running" && retryCount < 2) {
          ++retryCount;
          throw webjobstate;
        }
        return webjobstate;
      })
      .retryWhen(obs => {
        // take(3) is required in case the original ARM call fails
        return obs.delay(4000).take(3).concat(Observable.throw(new Error('Retry limit exceeded!')))
      })
      .subscribe(webjobstate => {
        this.checkingDaasWebJobStatus = false;
        if (webjobstate !== "Running") {
          this.daasRunnerJobRunning = false;
          return;
        }
        else {
          this.DaasValidated.emit(true);
        }
      }, error => {
        // We come in this block if the ARM call to get webjob fails
        this.checkingDaasWebJobStatus = false;
        this.daasRunnerJobRunning = false;
        this.error = `Failed while retrieving DaaS webjob state `;
      });
  }


}
