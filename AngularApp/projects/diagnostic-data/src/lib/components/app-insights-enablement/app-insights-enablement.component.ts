import { Component, OnInit, Input } from '@angular/core';
import { AppInsightsQueryService } from '../../services/appinsights.service';
import { HttpHeaders } from '@angular/common/http';
import { SettingsService } from '../../services/settings.service';
import { BackendCtrlQueryService } from '../../services/backend-ctrl-query.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';

@Component({
  selector: 'app-insights-enablement',
  templateUrl: './app-insights-enablement.component.html',
  styleUrls: ['./app-insights-enablement.component.scss']
})

export class AppInsightsEnablementComponent implements OnInit {

  constructor(private _appInsightsService: AppInsightsQueryService,
    private _backendCtrlService: BackendCtrlQueryService,
    private _settingsService: SettingsService) {
  }

  loadingSettings: boolean = true;
  isAppInsightsEnabled: boolean = false;
  isAppInsightsConnected: boolean = false;
  appInsightsValidated: boolean = false;
  appInsightsResourceUri: string = "";
  appId: string = "";
  connecting: boolean = false;
  error: any;
  appSettingsHaveInstrumentationKey: boolean = false;
  hasWriteAccess: boolean = false;
  isEnabledInProd: boolean = true;

  @Input()
  resourceId: string = "";

  ngOnInit() {
    if (this.isEnabledInProd) {
      this._appInsightsService.loadAppInsightsResourceObservable.subscribe(loadStatus => {
        if (loadStatus === true) {
          let appInsightsSettings = this._appInsightsService.appInsightsSettings;
          this.isAppInsightsEnabled = appInsightsSettings.enabledForWebApp;
          this.appInsightsResourceUri = appInsightsSettings.resourceUri;
          this.appId = appInsightsSettings.appId;

          if (this.isAppInsightsEnabled) {
            this._appInsightsService.logAppInsightsEvent(this.resourceId, TelemetryEventNames.AppInsightsEnabled);
            this._settingsService.getAppInsightsConnected().subscribe(connected => {
              if (connected) {
                this._appInsightsService.logAppInsightsEvent(this.resourceId, TelemetryEventNames.AppInsightsAlreadyConnected);
                this.isAppInsightsConnected = true;
                const additionalHeaders = new HttpHeaders({ 'resource-uri': this.resourceId });
                this._backendCtrlService.get<any>(`api/appinsights/validate`, additionalHeaders).subscribe(resp => {
                  if (resp === true) {
                    this.appInsightsValidated = true;
                  }
                  this.loadingSettings = false;
                }, error => {
                  this.loadingSettings = false;
                  this._appInsightsService.logAppInsightsEvent(this.resourceId, TelemetryEventNames.AppInsightsConfigurationInvalid);
                });
              } else {

                //
                // If AppInsights is not connected already, check if the user has write access to the 
                // AppInsights resource by checking ARM permissions
                //
                const additionalHeaders = new HttpHeaders({ 'appinsights-resource-uri': this.appInsightsResourceUri });
                this._backendCtrlService.get<any>(`api/appinsights/checkappinsightsaccess`, additionalHeaders).subscribe(resp => {
                  if (resp === true) {
                    this.hasWriteAccess = true;
                  } else {
                    this._appInsightsService.logAppInsightsEvent(this.resourceId, TelemetryEventNames.AppInsightsResourceMissingWriteAccess);
                  }
                  this.loadingSettings = false;
                }, errorCheckingAccess => {
                  this._appInsightsService.logAppInsightsError(this.resourceId, TelemetryEventNames.AppInsightsAccessCheckError, errorCheckingAccess);
                  this.loadingSettings = false;
                  this.hasWriteAccess = false;
                });
              }
            });
          } else {
            this._appInsightsService.logAppInsightsEvent(this.resourceId, TelemetryEventNames.AppInsightsNotEnabled)
            this.loadingSettings = false;
          }
        } else if (loadStatus === false) {

          if (this._appInsightsService.appInsightsSettings.appSettingsHaveInstrumentationKey
            && !this._appInsightsService.appInsightsSettings.enabledForWebApp) {

            //
            // This is the case where we found Instrumention Key in AppSettings but 
            // we failed to reverse lookup Application Insights resource corresponding
            // to the app settings. This can happen if the app has the AppSetting set
            // incorrectly or the current user has access to the app but does not have 
            // access on the subscription to list all the AppInsights resources
            //
            this.appSettingsHaveInstrumentationKey = true;
            this._appInsightsService.logAppInsightsEvent(this.resourceId, TelemetryEventNames.AppInsightsFromDifferentSubscription);
          }
          this.loadingSettings = false;
        }
      });
    }
  }

  enable() {
    this._appInsightsService.logAppInsightsEvent(this.resourceId, TelemetryEventNames.AppInsightsEnableClicked);
    this._appInsightsService.openAppInsightsBlade();
  }

  connect() {
    this.connecting = true;
    const additionalHeaders = new HttpHeaders({ 'resource-uri': this.resourceId, 'appinsights-resource-uri': this.appInsightsResourceUri, 'appinsights-app-id': this.appId });
    this._backendCtrlService.put<any, null>(`api/appinsights`, null, additionalHeaders).subscribe(resp => {
      this.connecting = false;
      if (resp === true) {
        this.isAppInsightsConnected = true;
        this.appInsightsValidated = true;
        this._appInsightsService.logAppInsightsEvent(this.resourceId, TelemetryEventNames.AppInsightsConnected);
      }
    }, error => {
      this.connecting = false;
      this.error = error.error ? error.error : JSON.stringify(error);
      this.error = "Failed while connecting App Insights with App Service Diagnostics. Error - " + this.error;
      this._appInsightsService.logAppInsightsError(this.resourceId, TelemetryEventNames.AppInsightsConnectionError, this.error);
    });
  }

}
