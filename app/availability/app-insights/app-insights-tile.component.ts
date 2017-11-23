import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AppInsightsService, PortalActionService } from '../../shared/services';
import { StartupInfo } from '../../shared/models/portal';

@Component({
    selector: 'app-insights-tile',
    templateUrl: 'app-insights-tile.component.html',
    styleUrls: ['app-insights-tile.component.css']
})
export class AppInsightsTileComponent {

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    constructor(public appInsightsService: AppInsightsService, public portalActionService: PortalActionService) {
    }

    OpenAppInsights() {
        this.portalActionService.openAppInsightsBlade();
    }
}
