import { Component, OnInit, Input } from '@angular/core';
import { AppInsightsQueryService } from '../../services/appinsights.service';
import { HttpHeaders } from '@angular/common/http';
import { SettingsService } from '../../services/settings.service';
import { BackendCtrlQueryService } from '../../services/backend-ctrl-query.service';

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

  isEnabledInProd: boolean = false;

  @Input()
  resourceId: string = "";

  ngOnInit() {
    if (this.isEnabledInProd) {
      this._appInsightsService.loadAppInsightsResourceObservable.subscribe(loadStatus => {
        if (loadStatus === true) {
          let appInsightsSettings = this._appInsightsService.appInsightsSettings;
          this.isAppInsightsEnabled = appInsightsSettings.enabledForWebApp;
          this.appInsightsResourceUri = appInsightsSettings.resourceUri;
          this.appId = appInsightsSettings.appId

          if (this.isAppInsightsEnabled) {
            this._settingsService.getAppInsightsConnected().subscribe(connected => {
              if (connected) {
                this.isAppInsightsConnected = true;
                const additionalHeaders = new HttpHeaders({ 'resource-uri': this.resourceId });
                this._backendCtrlService.get<any>(`api/appinsights/validate`, additionalHeaders).subscribe(resp => {                  
                  if (resp === true) {
                    this.appInsightsValidated = true;
                  }
                  this.loadingSettings = false;
                }, error => {
                  this.loadingSettings = false;
                });
              } else {
                this.loadingSettings = false;
              }
            });
          } else {
            this.loadingSettings = false;
          }
        } else if (loadStatus === false) {
          this.loadingSettings = false;
        }
      });
    }
  }

  enable() {
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
      }
    }, error => {
      this.connecting = false;
      this.error = error.error ? error.error : JSON.stringify(error);
      this.error = "Failed while connecting App Insights with App Service Diagnostics. Error - " + this.error;
    });
  }

}
