import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ServerFarmDataService } from '../../services/server-farm-data.service';
import { DaasService } from '../../services/daas.service';
import { SiteDaasInfo } from '../../models/solution-metadata';
import { DiagnoserDefinition } from '../../models/daas';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'daas-validator',
  templateUrl: './daas-validator.component.html'
})
export class DaasValidatorComponent implements OnInit {

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() DiagnoserName: string;

  @Output() DaasValidated: EventEmitter<boolean> = new EventEmitter<boolean>();

  supportedTier: boolean = false;
  diagnoserWarning: string = "";
  daasRunnerJobRunning: boolean = true;
  checkingDaasWebJobStatus: boolean = false;
  checkingSupportedTier: boolean = true;
  foundDiagnoserWarnings: boolean = false;
  retrievingDiagnosers: boolean = false;
  error: any;

  constructor(private _serverFarmService: ServerFarmDataService, private _daasService: DaasService) {

  }

  validateDaasSettings()
  {
    this.checkingSupportedTier = true;
    console.log("Clicked");
    this._serverFarmService.siteServerFarm.subscribe(serverFarm => {
      if (serverFarm) {
        this.checkingSupportedTier = false;
        if (serverFarm.sku.tier === "Standard" || serverFarm.sku.tier === "Basic" || serverFarm.sku.tier === "Premium" || serverFarm.sku.tier === "Isolated") {
          this.supportedTier = true;
          this.checkingDaasWebJobStatus = true;

          this.checkDaasWebJobState().subscribe(webjobstate => {
            this.checkingDaasWebJobStatus = false;
            if (webjobstate != "Running") {
              this.daasRunnerJobRunning = false;
              return;
            }

            this.retrievingDiagnosers = true;
            this._daasService.getDiagnosers(this.siteToBeDiagnosed).retry(2)
              .subscribe(result => {
                let diagnosers: DiagnoserDefinition[] = result;
                let thisDiagnoser = diagnosers.filter(x => x.Name === this.DiagnoserName);
                if (thisDiagnoser.length > 0) {
                  if (thisDiagnoser[0].Warnings.length > 0) {
                    this.diagnoserWarning = thisDiagnoser[0].Warnings.join(',');
                    this.foundDiagnoserWarnings = true;
                  }
                }

                this.retrievingDiagnosers = false;
                if (!this.foundDiagnoserWarnings) {
                  this.DaasValidated.emit(true);
                }
              },
                error => {
                  this.error = error;
                });
          });
        }
      }
    }, error => {
      //TODO: handle error
    })
  }

  ngOnInit(): void {

    this.validateDaasSettings();
  }

  // Implementing a retry logic if DAAS Webjob is not running because just my making a HTTP call,
  // we are able to warm upthe kudu site and this webjob might just start after a few seconds.
  checkDaasWebJobState(): Observable<string> {
    let retryCount: number = 0;
    return this._daasService.getDaasWebjobState(this.siteToBeDiagnosed)
      .map(response => {
        if (response.json() !== "Running" && retryCount < 2) {
          retryCount++;
          throw response;
        }
        return response;
      })
      .map(response => {
        return response.text() ? response.json() : '';
      })
      .retryWhen(obs => {
        return obs.delay(3000);
      });
  }

}
