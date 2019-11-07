
import { throwError as observableThrowError, of, Observable, combineLatest } from 'rxjs';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ServerFarmDataService } from '../../services/server-farm-data.service';
import { DaasService } from '../../services/daas.service';
import { SiteDaasInfo } from '../../models/solution-metadata';
import { DiagnoserDefinition, DaasValidationResult } from '../../models/daas';
import { SiteService } from '../../services/site.service';
import { catchError, retry, map, retryWhen, delay, take, concat } from 'rxjs/operators';

@Component({
  selector: 'daas-validator',
  templateUrl: './daas-validator.component.html'
})
export class DaasValidatorComponent implements OnInit {

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() diagnoserName: string;
  @Output() DaasValidated: EventEmitter<DaasValidationResult> = new EventEmitter<DaasValidationResult>();
  @Input() sessionInProgress: boolean;

  supportedTier: boolean = false;
  checkingSkuSucceeded: boolean = false;
  diagnoserWarning: string = '';
  daasRunnerJobRunning: boolean = true;
  checkingDaasWebJobStatus: boolean = false;
  checkingSupportedTier: boolean = true;
  foundDiagnoserWarnings: boolean = false;
  alwaysOnEnabled: boolean = true;
  error: string = '';
  storageAccountNeeded: boolean = false;
  diagnosersRequiringStorageAccount: string[] = ['Memory Dump'];
  validationResult: DaasValidationResult = new DaasValidationResult();
  diagnosers: DiagnoserDefinition[];

  constructor(private _serverFarmService: ServerFarmDataService, private _siteService: SiteService, private _daasService: DaasService) {
  }

  validateDaasSettings() {
    this.error = '';
    this.supportedTier = false;
    this.diagnoserWarning = '';
    this.daasRunnerJobRunning = true;
    this.checkingDaasWebJobStatus = false;
    this.checkingSupportedTier = true;
    this.foundDiagnoserWarnings = false;

    combineLatest(
      this._serverFarmService.siteServerFarm.pipe(catchError(err => {
        this.checkingSupportedTier = false;
        this.error = `Failed with error ${JSON.stringify(err)} while checking web app's tier`;
        return of(err);
      })),
      this._siteService.getAlwaysOnSetting(this.siteToBeDiagnosed).pipe(catchError(err => {
        this.alwaysOnEnabled = false;
        this.error = `Failed with error ${JSON.stringify(err)} while checking always on setting`;
        return of(err);
      })),
      this._daasService.getDiagnosers(this.siteToBeDiagnosed).pipe(
        retry(2),
        catchError(err => {
          this.error = `Failed with error ${JSON.stringify(err)} while retrieving DaaS settings`;
          return of(err);
        }))
    ).subscribe(results => {
      this.checkingSupportedTier = false;
      const serverFarm = results[0];
      this.alwaysOnEnabled = results[1];
      this.diagnosers = results[2];

      if (serverFarm != null) {
        this.checkingSkuSucceeded = true;
        if (serverFarm.sku.tier === 'Standard' || serverFarm.sku.tier.indexOf('Premium') > -1 || serverFarm.sku.tier === 'Isolated') {
          this.supportedTier = true;
        } else {
          return;
        }
      }

      if (!this.alwaysOnEnabled) {
        return;
      } else {
        // If AlwaysOn is set to TRUE, we can be sure that the site is running in a
        // supported tier as AlwaysOn is not available in BASIC SKU
        this.supportedTier = true;
      }

      if (this.error === '') {
        if (this.checkDiagnoserWarnings()) {
          return;
        }
        if (!this.foundDiagnoserWarnings) {
          this.checkDaasWebjobState();
        }
      }
    });
  }

  checkDiagnoserWarnings(): boolean {
    const thisDiagnoser = this.diagnosers.find(x => x.Name === this.diagnoserName);
    if (thisDiagnoser) {
      if (thisDiagnoser.Warnings.length > 0) {
        this.diagnoserWarning = thisDiagnoser.Warnings.join(',');
        this.foundDiagnoserWarnings = true;
      } else {
        this.foundDiagnoserWarnings = false;
      }
    }
    return this.foundDiagnoserWarnings;
  }
  ngOnInit(): void {
    this.validateDaasSettings();
  }

  validateDiagnoser(): void {
    this.storageAccountNeeded = this.diagnosersRequiringStorageAccount.findIndex(x => x === this.diagnoserName) >= 0;
    if (this.checkDiagnoserWarnings()) {
      this.validationResult.Validated = false;
      this.DaasValidated.emit(this.validationResult);
      return;
    }
    if (!this.storageAccountNeeded) {
      this.validationResult.Validated = true;
      this.DaasValidated.emit(this.validationResult);
    }
  }

  checkDaasWebjobState() {
    this.checkingDaasWebJobStatus = true;
    let retryCount: number = 0;
    this._daasService.getDaasWebjobState(this.siteToBeDiagnosed).pipe(
      map(webjobstate => {
        if (webjobstate !== 'Running' && retryCount < 2) {
          ++retryCount;
          throw webjobstate;
        }
        return webjobstate;
      }),
      retryWhen(obs => {
        // take(3) is required in case the original ARM call fails
        return obs.pipe(delay(4000), take(3), concat(observableThrowError(new Error('Retry limit exceeded!'))));
      }))
      .subscribe(webjobstate => {
        this.checkingDaasWebJobStatus = false;
        if (webjobstate !== 'Running') {
          this.daasRunnerJobRunning = false;
          return;
        } else {
          this.validateDiagnoser();
        }
      }, error => {
        // We come in this block if the ARM call to get webjob fails
        this.checkingDaasWebJobStatus = false;
        this.daasRunnerJobRunning = false;
        this.error = `Failed while retrieving DaaS webjob state `;
      });
  }

  onStorageAccountValidated(event: DaasValidationResult) {
    this.DaasValidated.emit(event);
  }
}
