import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { StorageService } from '../../../services/storage.service';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { StorageAccount } from '../../../models/storage';
import { DaasService } from '../../../services/daas.service';
import { SiteService } from '../../../services/site.service';

@Component({
  selector: 'configure-storage-account',
  templateUrl: './configure-storage-account.component.html',
  styleUrls: ['./configure-storage-account.component.scss']
})
export class ConfigureStorageAccountComponent implements OnInit {

  constructor(private _storageService: StorageService, private _daasService: DaasService, private _siteService: SiteService) { }

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() sessionInProgress: boolean;
  @Output() StorageAccountValidated: EventEmitter<boolean> = new EventEmitter<boolean>();

  Options = [
    { option: 'CreateNew', Text: 'Create new' },
    { option: 'ChooseExisting', Text: 'Choose existing' }
  ];

  chosenOption: any = this.Options[0];
  newStorageAccountName: string = '';
  storageAccounts: StorageAccount[] = [];
  chosenStorageAccount: StorageAccount;
  blobSasUri: string = '';
  saveEnabled: boolean = false;
  checkingBlobSasUriConfigured: boolean = true;
  creatingStorageAccount: boolean = false;
  generatingSasUri: boolean = false;
  editMode: boolean = false;

  ngOnInit() {
    this._storageService.getStorageAccounts(this.siteToBeDiagnosed.subscriptionId).subscribe(resp => {
      this.storageAccounts = resp;
      this._daasService.getBlobSasUri(this.siteToBeDiagnosed).subscribe(resp => {
        this.checkingBlobSasUriConfigured = false;
        if (!resp.BlobSasUri) {
          this.setDefaultValues();
        } else {
          this.blobSasUri = resp.BlobSasUri;
          this.StorageAccountValidated.emit(true);
        }
      });
    });
  }

  setDefaultValues() {
    this.chosenStorageAccount = this.storageAccounts[0];
    this.saveEnabled = true;
    this.newStorageAccountName = this._siteService.currentSiteStatic.name.substring(0, 6) + this.randomHash();
  }

  randomHash(): string {
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
  }

  chooseOption(option: any) {
    this.chosenOption = option;
  }

  updateStorageAccount(storageAccount: string) {
    this.newStorageAccountName = storageAccount;
    if (this.newStorageAccountName.length < 4 && this.chosenOption.option === 'CreateNew') {
      this.saveEnabled = false;
    } else {
      this.saveEnabled = true;
    }
  }

  saveChanges() {
    if (this.chosenOption.option === 'ChooseExisting') {
      this.setBlobSasUri(this.chosenStorageAccount.id, this.chosenStorageAccount.name);
    } else {
      this.creatingStorageAccount = true;
      this._storageService.createStorageAccount(this.siteToBeDiagnosed.subscriptionId, this.siteToBeDiagnosed.resourceGroupName, this.newStorageAccountName, this._siteService.currentSiteStatic.location).subscribe(storageAccountId => {
        this.creatingStorageAccount = false;
        if (storageAccountId !== "Invalid Response") {
          this.setBlobSasUri(storageAccountId, this.newStorageAccountName);
        }
      });
    }

  }

  setBlobSasUri(storageAccountId: string, storageAccountName: string) {
    this.generatingSasUri = true;
    this._storageService.getStorageAccountKey(storageAccountId).subscribe(resp => {
      if (resp.keys && resp.keys.length > 0) {
        let storageKey = resp.keys[0].value;
        this._daasService.setBlobSasUri(this.siteToBeDiagnosed, storageAccountName, storageKey).subscribe(resp => {
          if (resp) {
            this._daasService.getBlobSasUri(this.siteToBeDiagnosed).subscribe(resp => {
              this.generatingSasUri = false;
              if (resp.BlobSasUri && resp.BlobSasUri.length > 0) {
                this.blobSasUri = resp.BlobSasUri;
                this.editMode = false;
                this.StorageAccountValidated.emit(true);
              }
            });
          } else {
            //handle error
          }
        })
      }
    });
  }

  getBlobSasUriShort(): string {
    let u = new URL(this.blobSasUri);
    return u.hostname + '/' + u.pathname.replace('/', '');
  }

  getLocations(): string[] {
    let x = this.storageAccounts.map(a => a.location).filter((location, index, arr) => arr.indexOf(location) == index);
    return x;
  }

  getStorageAccountsForLocation(location: string) {
    return this.storageAccounts.filter(x => x.location === location)
  }

  enableEditMode() {
    if (!this.sessionInProgress) {
      this.editMode = true;
      this.setDefaultValues();
      this.StorageAccountValidated.emit(false);
    }
  }

  cancel() {
    this.editMode = false;
    this.StorageAccountValidated.emit(true);
  }

}
