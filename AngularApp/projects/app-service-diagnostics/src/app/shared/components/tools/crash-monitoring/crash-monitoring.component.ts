import { Component, OnInit } from '@angular/core';
import { IDatePickerProps, IDropdownOption } from 'office-ui-fabric-react';
import * as momentNs from 'moment';
import { addMonths, addDays } from 'office-ui-fabric-react/lib/utilities/dateMath/DateMath';
import { StorageService } from '../../../services/storage.service';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';
import { StorageAccount } from '../../../models/storage';
import { DaasService } from '../../../services/daas.service';
import { Globals } from '../../../../globals'
import { TelemetryService } from 'diagnostic-data';

@Component({
  selector: 'crash-monitoring',
  templateUrl: './crash-monitoring.component.html',
  styleUrls: ['./crash-monitoring.component.scss']
})
export class CrashMonitoringComponent implements OnInit {

  constructor(private _storageService: StorageService, private _siteService: SiteService, private _daasService: DaasService, private globals: Globals, private telemetryService:TelemetryService) {
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

  formatDate: IDatePickerProps['formatDate'] = (date) => {
    return momentNs(date).format('YYYY-MM-DD');
  };

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
    storageAccounts.forEach(acc => {
      if (acc.location === currentLocation) {
        this.storageAccounts.push({
          key: acc.name,
          text: acc.name,
          ariaLabel: acc.name,
          isSelected: configuredSasUri != null && configuredSasUri.toLowerCase().indexOf(acc.name.toLowerCase() + ".") > -1 ? true : false
        });
      }
    });
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

  selectFabricKey(event: any) {

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

    }
  }

  validateSettings(): boolean {
    this.validationError = ""
    let isValid: boolean = true;
    if (this.getErrorMessageOnTextField(this.startClock) === "" && this.getErrorMessageOnTextField(this.endClock) === "") {
      var startTimeValues = this.startClock.split(":");
      var endTimeValues = this.endClock.split(":");

      let actualStartTime = this.getChosenDateTime(this.startDate, startTimeValues);
      let actualEndTime = this.getChosenDateTime(this.endDate, endTimeValues);

      if (actualStartTime >= actualEndTime) {
        isValid = false;
        this.validationError = "Start date and time cannot be greater than or equal to end date and time";
      }

    } else {
      isValid = false;
      this.validationError = "Invalid Start time or Stop time";
    }
    return isValid;
  }

  getChosenDateTime(date: Date, values: string[]): Date {
    let dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDay());
    dateTime.setUTCHours(parseInt(values[0]));
    dateTime.setUTCMinutes(parseInt(values[1]));
    dateTime.setUTCSeconds(0);
    dateTime.setUTCMilliseconds(0);
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

}

export enum toolStatus {
  Loading,
  CheckingStorageAccounts,
  CheckingBlobSasUri,
  Loaded,
  ConfiguringBlobSasUri,
  Error
}