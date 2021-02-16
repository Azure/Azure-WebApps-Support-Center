import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { DaasService } from '../../../services/daas.service';
import { DaasValidationResult } from '../../../models/daas';
import { Globals } from '../../../../globals'
import { SharedStorageAccountService } from '../../../../shared-v2/services/shared-storage-account.service';
import { TelemetryService } from 'projects/diagnostic-data/src/lib/services/telemetry/telemetry.service';

@Component({
  selector: 'configure-storage-account',
  templateUrl: './configure-storage-account.component.html',
  styleUrls: ['./configure-storage-account.component.scss']
})
export class ConfigureStorageAccountComponent implements OnInit {

  constructor(private _daasService: DaasService, private globals: Globals,
    private _sharedStorageAccountService: SharedStorageAccountService,
    private telemetryService: TelemetryService) {
    this._sharedStorageAccountService.changeEmitted$.subscribe(newStorageAccount => {
      this.chosenStorageAccount = newStorageAccount.name;
      if (this.chosenStorageAccount) {
        this.error = null;
      }

      if (newStorageAccount.sasUri) {
        this.validationResult.BlobSasUri = newStorageAccount.sasUri;
        this.validationResult.Validated = true;
        this.validationResult.SasUriAsAppSetting = true;
        this.StorageAccountValidated.emit(this.validationResult);
      }

    });
  }

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() sessionInProgress: boolean;
  @Output() StorageAccountValidated: EventEmitter<DaasValidationResult> = new EventEmitter<DaasValidationResult>();

  chosenStorageAccount: string;
  checkingBlobSasUriConfigured: boolean = true;
  validationResult: DaasValidationResult = new DaasValidationResult();
  error: any;

  toggleStorageAccountPanel() {
    this.globals.openCreateStorageAccountPanel = !this.globals.openCreateStorageAccountPanel;
    this.telemetryService.logEvent("OpenCreateStorageAccountPanel");
    this.telemetryService.logPageView("CreateStorageAccountPanelView");
  }

  getStorageAccountNameFromSasUri(blobSasUri: string): string {
    let blobUrl = new URL(blobSasUri);
    return blobUrl.host.split('.')[0];
  }

  ngOnInit() {

    this.checkingBlobSasUriConfigured = true;

    this._daasService.getBlobSasUri(this.siteToBeDiagnosed).subscribe(daasSasUri => {
      this.checkingBlobSasUriConfigured = false;
      if (daasSasUri.SasUri) {
        this.chosenStorageAccount = this.getStorageAccountNameFromSasUri(daasSasUri.SasUri);
        this.validationResult.BlobSasUri = daasSasUri.SasUri;
        this.validationResult.SasUriAsAppSetting = daasSasUri.IsAppSetting;
        this.validationResult.Validated = true;
        this.StorageAccountValidated.emit(this.validationResult);
      }
    },
      error => {
        this.checkingBlobSasUriConfigured = false;
        this.error = error;
      });
  }

}