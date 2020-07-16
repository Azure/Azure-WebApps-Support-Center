import { Component, OnInit } from '@angular/core';
import { IDatePickerProps, IDropdownOption, SelectableOptionMenuItemType } from 'office-ui-fabric-react';
import * as momentNs from 'moment';
import { addMonths, addDays } from 'office-ui-fabric-react/lib/utilities/dateMath/DateMath';
import { StorageService } from '../../../services/storage.service';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';
import { StorageAccount } from '../../../models/storage';
import { DaasService } from '../../../services/daas.service';
import { Globals } from '../../../../globals'
import { TelemetryService } from 'diagnostic-data';
import { SharedStorageAccountService } from 'projects/app-service-diagnostics/src/app/shared-v2/services/shared-storage-account.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CrashMonitoringSettings } from '../../../models/daas';

@Component({
  selector: 'crash-monitoring',
  templateUrl: './crash-monitoring.component.html',
  styleUrls: ['./crash-monitoring.component.scss']
})
export class CrashMonitoringComponent implements OnInit {

  constructor(private _storageService: StorageService, private _siteService: SiteService,
    private _daasService: DaasService, private globals: Globals, private telemetryService: TelemetryService,
    private _sharedStorageAccountService: SharedStorageAccountService) {
    this._sharedStorageAccountService.changeEmitted$.subscribe(newStorageAccount => {
      this.addNewlyCreatedStorageAccount(newStorageAccount);
    })
  }

  today: Date = new Date(Date.now());
  storageAccounts: IDropdownOption[] = [];
  memoryDumpOptions: IDropdownOption[] = [];

  maxDate: Date = this.convertUTCToLocalDate(addMonths(this.today, 1))
  minDate: Date = this.convertUTCToLocalDate(this.today)
  startDate: Date = this.minDate;
  endDate: Date = addDays(this.startDate, 1);
  startClock: string;
  endClock: string;

  siteToBeDiagnosed: SiteDaasInfo;
  error: any;
  status: toolStatus = toolStatus.Loading;
  errorMessage: string;
  toolStatus = toolStatus;
  validationError: string = "";
  updatingStorageAccounts: boolean = false;
  defaultSelectedKey: string = "";
  selectedStorageAccount: StorageAccount = null;

  chosenStartDateTime: Date;
  chosenEndDateTime: Date;
  selectedDumpCount: number = 3;
  selectedTabKey: string = "0";

  formatDate: IDatePickerProps['formatDate'] = (date) => {
    return momentNs(date).format('YYYY-MM-DD');
  };

  addNewlyCreatedStorageAccount(newStorageAccount: StorageAccount) {
    if (this.storageAccounts != null
      && this.storageAccounts.findIndex(x => x.key === newStorageAccount.name) === -1) {

      //
      // If we are just changing this.storageAccounts, the dropdown is not reflecting the correct
      // status for some reason. Instead, we clear this.storageAccounts array, clone it and then
      // assign the newly created array to this.storageAccounts and that seems to have done the trick 
      //
      let tempArray: IDropdownOption[] = JSON.parse(JSON.stringify(this.storageAccounts));
      this.storageAccounts = [];
      tempArray.forEach(val => {
        val.selected = false;
        val.isSelected = false;
      })

      tempArray.push({
        key: newStorageAccount.name,
        text: newStorageAccount.name,
        ariaLabel: newStorageAccount.name,
        data: newStorageAccount,
        isSelected: true,
        selected: true
      });

      this.storageAccounts = tempArray;
      this.defaultSelectedKey = newStorageAccount.name
      this.selectedStorageAccount = newStorageAccount;

    }
  }

  ngOnInit() {

    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
      this._storageService.getStorageAccounts(this.siteToBeDiagnosed.subscriptionId).subscribe(resp => {
        this.status = toolStatus.CheckingBlobSasUri;
        let storageAccounts = resp;

        this._daasService.getBlobSasUri(this.siteToBeDiagnosed).subscribe(resp => {
          this.status = toolStatus.CheckingBlobSasUri;
          let configuredSasUri = "";
          if (!resp.BlobSasUri) {
            //this.setDefaultValues();
          } else {
            configuredSasUri = resp.BlobSasUri;
          }
          this.initStorageAccounts(storageAccounts, this.getSiteLocation(), configuredSasUri);
          this.status = toolStatus.Loaded;
        },
          error => {
            this.errorMessage = "Failed while checking configured storage account";
            this.status = toolStatus.Error;
            this.error = error;
          });


      },
        error => {
          this.errorMessage = "Failed to retrieve storage accounts";
          this.status = toolStatus.Error;
          this.error = error;
        });
    });

    this.startClock = this.getHourAndMinute(this.startDate);
    this.endClock = this.getHourAndMinute(this.endDate);

    this.initDumpOptions();
  }

  getSiteLocation() {
    let location = this._siteService.currentSiteStatic.location;
    location = location.replace(/\s/g, "").toLowerCase();
    return location;
  }

  initStorageAccounts(storageAccounts: StorageAccount[], currentLocation: string, configuredSasUri: string = "") {
    this.storageAccounts = [];
    let accountsCurrentLocation = storageAccounts.filter(x => x.location === currentLocation);

    for (let index = 0; index < accountsCurrentLocation.length; index++) {
      let isSelected = false;
      const acc = accountsCurrentLocation[index];
      if (configuredSasUri && configuredSasUri.toLowerCase().indexOf(acc.name.toLowerCase() + ".") > -1) {
        isSelected = true;
      }
      else {
        if (!configuredSasUri && index === 0) {
          isSelected = true;
        }
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

  initDumpOptions() {

    this.memoryDumpOptions = [];
    for (let index = 1; index < 6; index++) {
      this.memoryDumpOptions.push({
        key: index.toString(),
        text: index.toString(),
        ariaLabel: index.toString() + " dumps (s)",
        isSelected: index === 3 ? true : false
      });
    }

  }

  selectStorageAccount(event: any) {
    this.selectedStorageAccount = event.option.data;
  }

  onSelectStartDateHandler(event: any) {
    if (event != null && event.date != null) {
      this.startDate = event.date;
    }
  }

  onSelectEndDateHandler(event: any) {
    if (event != null && event.date != null) {
      this.endDate = event.date;
    }
  }

  startMonitoring() {
    if (this.validateSettings()) {
      this.saveMonitoringSettings(this.selectedStorageAccount.id, this.selectedStorageAccount.name);
    }
  }

  validateSettings(): boolean {
    this.validationError = ""
    let isValid: boolean = true;
    if (this.getErrorMessageOnTextField(this.startClock) === "" && this.getErrorMessageOnTextField(this.endClock) === "") {
      var startTimeValues = this.startClock.split(":");
      var endTimeValues = this.endClock.split(":");

      this.chosenStartDateTime = this.getDateWithTime(this.startDate, startTimeValues);
      this.chosenEndDateTime = this.getDateWithTime(this.endDate, endTimeValues);

      if (this.chosenStartDateTime >= this.chosenEndDateTime) {
        isValid = false;
        this.validationError = "Start date and time cannot be greater than or equal to end date and time";
      }

    } else {
      isValid = false;
      this.validationError = "Invalid Start time or Stop time";
    }
    return isValid;
  }

  getDateWithTime(date: Date, values: string[]): Date {
    let dateTime = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(values[0]), parseInt(values[1]), 0, 0));
    return dateTime
  }

  //Get HH:mm from date
  private getHourAndMinute(date: Date): string {
    return momentNs(date).format('HH:mm');
  }

  //convert ISO string(UTC time) to LocalDate with same year,month,date...
  private convertUTCToLocalDate(date: Date): Date {
    const moment = momentNs.utc(date);
    return new Date(
      moment.year(), moment.month(), moment.date(),
      moment.hour(), moment.minute()
    );
  }

  getErrorMessageOnTextField(value: string): string {
    var values = value.split(":");
    var errorMessage = "";
    if (!(values.length > 1 && +values[0] <= 24 && +values[1] <= 59)) {
      errorMessage = `Invalid time`;
    }
    return errorMessage;
  }

  toggleStorageAccountPanel() {
    this.globals.openCreateStorageAccountPanel = !this.globals.openCreateStorageAccountPanel;
    this.telemetryService.logEvent("OpenCreateStorageAccountPanel");
    //this.telemetryService.logPageView("SessionsPanelView");
  }

  saveMonitoringSettings(storageAccountId: string, storageAccountName: string) {
    this.status = toolStatus.ConfiguringBlobSasUri;
    this._storageService.getStorageAccountKey(storageAccountId).subscribe(resp => {
      if (resp.keys && resp.keys.length > 0) {
        let storageKey = resp.keys[0].value;
        this._daasService.setBlobSasUri(this.siteToBeDiagnosed, storageAccountName, storageKey).subscribe(resp => {
          if (resp) {
            this.status = toolStatus.BlobSasUriSaved;

            this.saveCrashMonitoringSettings(this.siteToBeDiagnosed, this.getCrashMonitoringSetting()).subscribe(resp => {
              this.status = toolStatus.SettingsSaved;
              this.selectedTabKey = "1";
              console.log("Settings saved");
            },
              error => {
                this.status = toolStatus.Error;
                this.errorMessage = "Failed while saving crash monitoring settings for the current app. ";
                this.error = error;
              });

          } else {
            this.status = toolStatus.Error;
            this.errorMessage = "Failed to set BlobSasUri for the current app."
            this.error = null;
          }
        },
          error => {
            this.status = toolStatus.Error;
            this.errorMessage = "Failed to set BlobSasUri for the current app. ";
            this.error = error;
          });
      }
    },
      error => {
        this.status = toolStatus.Error;
        this.errorMessage = "Failed while getting storage account key";
        this.error = error;
      });
  }

  selectDumpCount(event: any) {
    this.selectedDumpCount = parseInt(event.option.key);
  }

  getCrashMonitoringSetting(): CrashMonitoringSettings {
    let monitoringSettings: CrashMonitoringSettings = new CrashMonitoringSettings();
    let durationInHours = momentNs.utc(this.chosenEndDateTime).diff(momentNs.utc(this.chosenStartDateTime), 'hours', true);
    monitoringSettings.StartTimeUtc = momentNs.utc(this.chosenStartDateTime, momentNs.defaultFormatUtc).toISOString();
    monitoringSettings.MaxHours = Math.round(durationInHours * 100) / 100;
    monitoringSettings.MaxDumpCount = this.selectedDumpCount;

    return monitoringSettings;
  }

  changeTab(event: any) {
    if (event.item != null && event.item.props != null && event.item.props.itemKey != null)
      this.selectedTabKey = event.item.props.itemKey;
  }

  saveCrashMonitoringSettings(site: SiteDaasInfo, crashMonitoringSettings: CrashMonitoringSettings): Observable<any> {
    return this._siteService.getSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot).pipe(
      map(settingsResponse => {
        if (settingsResponse && settingsResponse.properties) {

          // Clear crashMonitoring settings.
          if (crashMonitoringSettings == null) {
            if (settingsResponse.properties['WEBSITE_CRASHMONITORING_SETTINGS']) {
              delete settingsResponse.properties['WEBSITE_CRASHMONITORING_SETTINGS'];
              if (settingsResponse.properties['WEBSITE_CRASHMONITORING_ENABLED']) {
                delete settingsResponse.properties['WEBSITE_CRASHMONITORING_ENABLED'];
                this._siteService.updateSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot, settingsResponse).subscribe(updateResponse => {
                  return updateResponse;
                });
              }
            }
          } else {
            settingsResponse.properties['WEBSITE_CRASHMONITORING_ENABLED'] = true;
            settingsResponse.properties['WEBSITE_CRASHMONITORING_SETTINGS'] = JSON.stringify(crashMonitoringSettings);
            this._siteService.updateSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot, settingsResponse).subscribe(updateResponse => {
              return updateResponse;
            });
          }
        }
      }));
  }
}

export enum toolStatus {
  Loading,
  CheckingStorageAccounts,
  CheckingBlobSasUri,
  Loaded,
  ConfiguringBlobSasUri,
  BlobSasUriSaved,
  SavingCrashMonitoringSettings,
  SettingsSaved,
  Error
}