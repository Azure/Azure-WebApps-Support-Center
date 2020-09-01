import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PanelType, IChoiceGroupOption, IDropdownOption } from 'office-ui-fabric-react';
import { Globals } from '../../../globals';
import { StorageService } from '../../../shared/services/storage.service';
import { SiteService } from '../../../shared/services/site.service';
import { SiteDaasInfo } from '../../../shared/models/solution-metadata';
import { SharedStorageAccountService, StorageAccountProperties } from '../../../shared-v2/services/shared-storage-account.service';
import { StorageAccount } from '../../../shared/models/storage';
import { DaasService } from '../../../shared/services/daas.service';
import { ArmService } from '../../../shared/services/arm.service';

@Component({
  selector: 'create-storage-account-panel',
  templateUrl: './create-storage-account-panel.component.html',
  styleUrls: ['./create-storage-account-panel.component.scss']
})
export class CreateStorageAccountPanelComponent implements OnInit {

  type: PanelType = PanelType.custom;
  width: string = "850px";
  error: any;
  creatingStorageAccount: boolean = false;
  siteToBeDiagnosed: SiteDaasInfo;
  newStorageAccountName: string;
  createNewMode: boolean = true;
  errorMessage: string = "";
  loadingStroageAccounts: boolean = true;
  defaultSelectedKey: string = "";
  selectedStorageAccount: StorageAccount = null;
  generatingSasUri: boolean = false;
  subscriptionId: string = "";
  resourceGroup: string = "";
  subscriptionName: string = "";
  private apiVersion: string = "2019-06-01";

  storageAccounts: IDropdownOption[] = [];
  choiceGroupOptions: IChoiceGroupOption[] = [
    { key: 'CreateNew', text: 'Create new', defaultChecked: true, onClick: () => { this.createNewMode = true } },
    { key: 'ChooseExisting', text: 'Choose existing', onClick: () => { this.createNewMode = false } }
  ];


  constructor(public globals: Globals, private _storageService: StorageService, private _daasService: DaasService,
    private _siteService: SiteService, private _sharedStorageAccountService: SharedStorageAccountService,
    private _armService: ArmService) { }

  ngOnInit() {

    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
      this.subscriptionId = site.subscriptionId;
      this.subscriptionName = this.subscriptionId;
      this.resourceGroup = site.resourceGroupName;
      this._armService.getArmResource<any>("subscriptions/" + this.subscriptionId, this.apiVersion).subscribe(subscriptionResponse => {
        if (subscriptionResponse != null) {
          this.subscriptionName = subscriptionResponse.displayName;
        }
      });
      this._storageService.getStorageAccounts(this.siteToBeDiagnosed.subscriptionId).subscribe(resp => {
        this.loadingStroageAccounts = false;
        let storageAccounts = resp;
        this.initStorageAccounts(storageAccounts, this.getSiteLocation());
      },
        error => {
          this.errorMessage = "Failed to retrieve storage accounts";
          this.error = error;
        });
      this.newStorageAccountName = this.getNewStorageAccoutName(this._siteService.currentSiteStatic.name);
    });
  }

  getNewStorageAccoutName(siteName: string): string {
    const searchRegExp = /-/gi;
    siteName = siteName.replace(searchRegExp, '');
    siteName = siteName.substring(0, siteName.length > 6 ? 6 : siteName.length);
    return siteName + this.randomHash().toLowerCase();
  }

  initStorageAccounts(storageAccounts: StorageAccount[], currentLocation: string) {
    this.storageAccounts = [];
    let accountsCurrentLocation = storageAccounts.filter(x => x.location === currentLocation);

    for (let index = 0; index < accountsCurrentLocation.length; index++) {
      let isSelected = false;
      const acc = accountsCurrentLocation[index];
      if (index === 0) {
        isSelected = true;
      }
      this.storageAccounts.push({
        key: acc.name,
        text: acc.name,
        ariaLabel: acc.name,
        data: acc,
        isSelected: isSelected
      });

      if (isSelected) {
        this.defaultSelectedKey = acc.name;
        this.selectedStorageAccount = acc;
      }
    }
  }

  getSiteLocation() {
    let location = this._siteService.currentSiteStatic.location;
    location = location.replace(/\s/g, "").toLowerCase();
    return location;
  }

  randomHash(): string {
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
  }

  dismissedHandler() {
    this.globals.openCreateStorageAccountPanel = false;
  }

  updateStorageAccount(e: { event: Event, newValue?: string }) {
    this.newStorageAccountName = e.newValue.toString();
  }

  saveChanges() {
    this.error = '';
    this.errorMessage = '';

    if (this.createNewMode) {
      this.creatingStorageAccount = true;
      this._storageService.createStorageAccount(this.siteToBeDiagnosed.subscriptionId, this.siteToBeDiagnosed.resourceGroupName, this.newStorageAccountName, this._siteService.currentSiteStatic.location)
        .subscribe(storageAccount => {
          if (!storageAccount) {
            this._storageService.createStorageAccount(this.siteToBeDiagnosed.subscriptionId, this.siteToBeDiagnosed.resourceGroupName, this.newStorageAccountName, this._siteService.currentSiteStatic.location)
              .subscribe(storageAccount => {
                this.creatingStorageAccount = false;
                this.setBlobSasUri(storageAccount.id, storageAccount.name);
              },
                error => {
                  this.creatingStorageAccount = false;
                  this.error = error;
                  this.errorMessage = "Failed to create a storage account";
                });
          }

        },
          error => {
            this.creatingStorageAccount = false;
            this.error = error;
            this.errorMessage = "Failed to create a storage account";
          });
    } else {
      this.setBlobSasUri(this.selectedStorageAccount.id, this.selectedStorageAccount.name);
    }

  }

  setBlobSasUri(storageAccountId: string, storageAccountName: string) {
    this.generatingSasUri = true;
    this._storageService.getStorageAccountKey(storageAccountId).subscribe(resp => {
      if (resp.keys && resp.keys.length > 0) {
        if (resp.keys[0].value == null) {
          this.generatingSasUri = false;
          this.error = "Failed to retrieve keys for this storage account. Please choose a different storage account or create a new one";
          return;
        }
        let storageKey = resp.keys[0].value;

        // TODO : Remove call to daasService.setBlobSasUri and change to below method
        // once the backend deployment of ANT90 is complete.
        // this.generateSasKey(storageAccountId, storageAccountName, storageKey);

        this._daasService.setBlobSasUri(this.siteToBeDiagnosed, storageAccountName, storageKey).subscribe(resp => {
          if (resp) {
            this._daasService.getBlobSasUri(this.siteToBeDiagnosed).subscribe(resp => {
              this.generatingSasUri = false;
              if (resp.BlobSasUri && resp.BlobSasUri.length > 0) {
                let storageAccountProperties: StorageAccountProperties = new StorageAccountProperties();
                storageAccountProperties.name = storageAccountName;
                storageAccountProperties.sasUri = "";
                this._sharedStorageAccountService.emitChange(storageAccountProperties);
                this.globals.openCreateStorageAccountPanel = false;
              }
            },
              error => {
                this.generatingSasUri = false;
                this.error = error;
              });
          } else {
            this.generatingSasUri = false;
            this.error = "Failed to set BlobSasUri for the current app."
          }
        },
          error => {
            this.generatingSasUri = false;
            this.errorMessage = "Failed to set BlobSasUri for the current app. ";
            this.error = error;
          });
      }
    },
      error => {
        this.errorMessage = "Failed while getting storage account key";
        this.generatingSasUri = false;
        this.error = error;
      });
  }

  generateSasKey(storageAccountId: string, storageAccountName: string, storageKey: string) {
    this._storageService.generateSasKey(storageAccountId, storageKey).subscribe(generatedSasUri => {
      if (generatedSasUri) {
        let storageAccountProperties: StorageAccountProperties = new StorageAccountProperties();
        storageAccountProperties.name = storageAccountName;
        storageAccountProperties.sasUri = `https://${storageAccountName}.blob.${this._armService.storageUrl}/${this._daasService.defaultContainerName}?${generatedSasUri}`;
        this._sharedStorageAccountService.emitChange(storageAccountProperties);
        this.globals.openCreateStorageAccountPanel = false;
      }
    }, error => {
      this.errorMessage = "Failed while generating SAS Key";
      this.generatingSasUri = false;
      this.error = error;
    });
  }

  selectStorageAccount(event: any) {
    this.selectedStorageAccount = event.option.data;
  }

}
