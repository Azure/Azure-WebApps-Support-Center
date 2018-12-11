import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IDetectorResponse, IMetricSet } from '../../../shared/models/detectorresponse';
import { StartupInfo } from '../../../shared/models/portal';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { AvailabilityLoggingService } from '../../../shared/services/logging/availability.logging.service';
import { AuthService } from '../../../startup/services/auth.service';
declare let d3: any;

@Component({
    templateUrl: 'detector-view-main.component.html',
    styles: ['.row { margin-top: 10px; }']
})
export class DetectorViewMainComponent implements OnInit {

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;
    detectorName: string;

    detectorResponse: IDetectorResponse;
    availabilityDetectorResponse: IDetectorResponse;
    availabilityDetectorMetrics: IMetricSet[];
    siteLatencyDetectorResponse: IDetectorResponse;
    siteLatencyDetectorMetrics: IMetricSet[];
    displayTopLevelGraph: boolean = true;
    metSLA: boolean = false;
    bladeOpenedFromSupportTicketFlow: boolean;

    constructor(private _route: ActivatedRoute, private _appAnalysisService: AppAnalysisService, private _logger: AvailabilityLoggingService, private _authService: AuthService) {
        this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
            this.bladeOpenedFromSupportTicketFlow = startupInfo.source !== undefined && startupInfo.source.toLowerCase() === 'casesubmission';
        });
    }

    ngOnInit(): void {
        this.detectorName = this._route.snapshot.params['detectorName'];
        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['resourcename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

        this.displayTopLevelGraph = this._route.firstChild.snapshot.routeConfig.path.indexOf('sitecpuanalysis') < 0;
    }

    logBackToAnalysis(){
        this._logger.LogClickEvent("BackToAnalysis", "DetectorView");
    }
}