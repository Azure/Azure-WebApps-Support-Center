import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { Globals } from '../../../globals';
import { StorageService } from '../../../shared/services/storage.service';
import { SiteService } from '../../../shared/services/site.service';
import { SiteDaasInfo } from '../../../shared/models/solution-metadata';
import { SharedStorageAccountService } from '../../../shared-v2/services/shared-storage-account.service';

@Component({
  selector: 'create-storage-account-panel',
  templateUrl: './create-storage-account-panel.component.html',
  styleUrls: ['./create-storage-account-panel.component.scss']
})
export class CreateStorageAccountPanelComponent implements OnInit {

  type: PanelType = PanelType.custom;
  width: string = "850px";
  error: any;
  creatingStorageAccount:boolean = false;
  siteToBeDiagnosed: SiteDaasInfo;
  newStorageAccountName:string;
  

  constructor(public globals: Globals, private _storageService:StorageService, private _siteService:SiteService, private _sharedStorageAccountService:SharedStorageAccountService) { }

  ngOnInit() {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
      this.newStorageAccountName = (this._siteService.currentSiteStatic.name.substring(0, 6) + this.randomHash()).toLowerCase();
    });
  }

  randomHash(): string {
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
  }

  dismissedHandler(){
    this.globals.openCreateStorageAccountPanel = false;
  }

  updateStorageAccount(storageAccount: string) {
    this.newStorageAccountName = storageAccount;
  }

  saveChanges(){
    this.creatingStorageAccount = true;
    this._storageService.createStorageAccount(this.siteToBeDiagnosed.subscriptionId, this.siteToBeDiagnosed.resourceGroupName, this.newStorageAccountName, this._siteService.currentSiteStatic.location)
      .subscribe(storageAccount => {
        if (!storageAccount) {
          this._storageService.createStorageAccount(this.siteToBeDiagnosed.subscriptionId, this.siteToBeDiagnosed.resourceGroupName, this.newStorageAccountName, this._siteService.currentSiteStatic.location)
            .subscribe(storageAccount => {
              this.creatingStorageAccount = false;
              this._sharedStorageAccountService.emitChange(storageAccount);
              this.globals.openCreateStorageAccountPanel = false;
            },
              error => {
                this.creatingStorageAccount = false;
                this.error = error;
              });
        }

      },
        error => {
          this.creatingStorageAccount = false;
          this.error = error;
        });
  }

}
