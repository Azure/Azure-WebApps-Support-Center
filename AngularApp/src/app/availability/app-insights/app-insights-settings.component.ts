import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs'
import { StartupInfo } from '../../shared/models/portal';
import { ArmObj } from '../../shared/models/armObj';
import { SiteService } from '../../shared/services/site.service';
import { AuthService } from '../../startup/services/auth.service';
import { AppInsightsService } from '../../shared/services/appinsights/appinsights.service';
import { AppInsightsQueryService } from '../../shared/services/appinsights/appinsights-query.service';

@Component({
    selector: 'app-insights-settings',
    templateUrl: 'app-insights-settings.component.html',
    styleUrls: ['app-insights-tile.component.css']
})
export class AppInsightsSettingsComponent implements OnInit {

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    connectingAppInsights: boolean;
    connectingAppInsightsSubAction: string;
    buttonText: string;

    constructor(private _route: ActivatedRoute, private siteService: SiteService, private authService: AuthService, public appInsightsService: AppInsightsService, public appInsightsQueryService: AppInsightsQueryService) {
        this.buttonText = "Connect App Insights with Support Center";
        this.connectingAppInsights = false;
        this.connectingAppInsightsSubAction = "Generating Read-Only API Key ...";

    }

    ngOnInit(): void {

        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';
    }

    connectAppInsightsWithSupportCenter(): void {

        if (this.connectingAppInsights) {
            return;
        }

        this.connectingAppInsights = true;
        this.connectingAppInsightsSubAction = "Generating Read-Only API Key ...";
        this.appInsightsService.GenerateAppInsightsAccessKey().subscribe(data => {
            if (data && data.apiKey && data.apiKey !== '') {

                this.siteService.getSiteAppSettings(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName).subscribe(settingsResponse => {

                    if (settingsResponse && settingsResponse.properties) {
                        settingsResponse.properties[this.appInsightsService.appId_AppSettingStr] = this.appInsightsService.appInsightsSettings.appId;
                        settingsResponse.properties[this.appInsightsService.appKey_AppSettingStr] = data.apiKey;
                        settingsResponse.properties[this.appInsightsService.resourceUri_AppSettingStr] = this.appInsightsService.appInsightsSettings.resourceUri;

                        this.connectingAppInsightsSubAction = "Updating Web-App Application Settings ...";
                        this.siteService.updateSiteAppSettings(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, settingsResponse).subscribe(updateResponse => {

                            this.appInsightsService.appInsightsSettings.connectedWithSupportCenter = true;
                            this.connectingAppInsights = false;
                        });
                    }
                });

            }
        })
    }
}
