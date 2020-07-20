import { Component, OnInit } from '@angular/core';
import { IDatePickerProps, IDropdownOption, SelectableOptionMenuItemType } from 'office-ui-fabric-react';
import * as momentNs from 'moment';
import { addMonths, addDays } from 'office-ui-fabric-react/lib/utilities/dateMath/DateMath';
import { StorageService } from '../../../services/storage.service';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { Globals } from '../../../../globals'
import { TelemetryService } from 'diagnostic-data';
import { SharedStorageAccountService } from 'projects/app-service-diagnostics/src/app/shared-v2/services/shared-storage-account.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CrashMonitoringSettings } from '../../../models/daas';
import moment = require('moment');

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
      this.chosenStorageAccount = newStorageAccount;
    })
  }

  today: Date = new Date(Date.now());
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
  chosenStorageAccount: string = "";

  chosenStartDateTime: Date;
  chosenEndDateTime: Date;
  selectedDumpCount: string = "3";
  selectedTabKey: string = "0";
  monitoringInPlace: boolean = false;


  formatDate: IDatePickerProps['formatDate'] = (date) => {
    return momentNs(date).format('YYYY-MM-DD');
  };

  ngOnInit() {

    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
      this.status = toolStatus.CheckingBlobSasUri;
      this._daasService.getBlobSasUri(this.siteToBeDiagnosed).subscribe(resp => {
        this.status = toolStatus.CheckingBlobSasUri;
        let configuredSasUri = "";
        if (resp.BlobSasUri) {
          configuredSasUri = resp.BlobSasUri;
          this.chosenStorageAccount = this.getStorageAccountNameFromSasUri(configuredSasUri);
        }
        this._siteService.getSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot).subscribe(settingsResponse => {
          if (settingsResponse && settingsResponse.properties) {
            if (settingsResponse.properties['WEBSITE_CRASHMONITORING_SETTINGS']
              && settingsResponse.properties['WEBSITE_CRASHMONITORING_ENABLED']
              && settingsResponse.properties['WEBSITE_CRASHMONITORING_ENABLED'].toString().toLowerCase() === "true") {
              this.populateSettings(settingsResponse.properties);
              this.monitoringInPlace = true;
            }
          }
          this.status = toolStatus.Loaded;
        });

      },
        error => {
          this.errorMessage = "Failed while checking configured storage account";
          this.status = toolStatus.Error;
          this.error = error;
        });
    });

    this.startClock = this.getHourAndMinute(this.startDate);
    this.endClock = this.getHourAndMinute(this.endDate);

    this.initDumpOptions();
  }

  populateSettings(settings: any) {
    let crashMonitoringSettings: CrashMonitoringSettings;
    crashMonitoringSettings = JSON.parse(settings['WEBSITE_CRASHMONITORING_SETTINGS']);
    if (crashMonitoringSettings.MaxDumpCount && crashMonitoringSettings.MaxDumpCount < 6) {
      this.selectedDumpCount = crashMonitoringSettings.MaxDumpCount.toString();
    }

    const startDate = momentNs.utc(crashMonitoringSettings.StartTimeUtc);
    this.startDate = startDate.toDate();
    this.startClock = startDate.hours() + ":" + startDate.minutes();
    let endDate: any;
    if (crashMonitoringSettings.MaxHours > 24) {
      let days: number = (crashMonitoringSettings.MaxHours) / 24;
      let hours = crashMonitoringSettings.MaxHours - (Math.floor(days) * 24);
      endDate = startDate.add(Math.floor(days), 'days');
      endDate = startDate.add(hours, 'hours');
    } else {
      endDate = startDate.add(crashMonitoringSettings.MaxHours, 'hours');
    }

    this.endDate = endDate.toDate();
    this.endClock = endDate.hours() + ":" + endDate.minutes();
  }

  getStorageAccountNameFromSasUri(blobSasUri: string): string {
    let blobUrl = new URL(blobSasUri);
    return blobUrl.host.split('.')[0];
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
    this.selectedDumpCount = "3";
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
      this.saveMonitoringSettings();
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

  saveMonitoringSettings() {
    this.saveCrashMonitoringSettings(this.siteToBeDiagnosed, this.getCrashMonitoringSetting()).subscribe(resp => {
      this.status = toolStatus.SettingsSaved;
      this.selectedTabKey = "1";
      this.monitoringInPlace = true;
    },
      error => {
        this.status = toolStatus.Error;
        this.errorMessage = "Failed while saving crash monitoring settings for the current app. ";
        this.error = error;
      });
  }

  selectDumpCount(event: any) {
    this.selectedDumpCount = event.option.key;
  }

  getCrashMonitoringSetting(): CrashMonitoringSettings {
    let monitoringSettings: CrashMonitoringSettings = new CrashMonitoringSettings();
    let durationInHours = momentNs.utc(this.chosenEndDateTime).diff(momentNs.utc(this.chosenStartDateTime), 'hours', true);
    monitoringSettings.StartTimeUtc = momentNs.utc(this.chosenStartDateTime, momentNs.defaultFormatUtc).toISOString();
    monitoringSettings.MaxHours = durationInHours;
    monitoringSettings.MaxDumpCount = parseInt(this.selectedDumpCount);

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
  CheckingBlobSasUri,
  Loaded,
  SavingCrashMonitoringSettings,
  SettingsSaved,
  Error
}