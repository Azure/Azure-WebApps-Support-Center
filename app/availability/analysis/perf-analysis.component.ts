import { Component, OnInit, trigger, state, animate, transition, style } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IAppAnalysisResponse } from '../../shared/models/appanalysisresponse';
import { IDetectorResponse, IMetricSet } from '../../shared/models/detectorresponse';
import { AppAnalysisService } from '../../shared/services';
import { Observable } from 'rxjs/Observable';
import { IAbnormalTimePeriod } from '../../shared/models/appanalysisresponse';
import { PortalActionService, ServerFarmDataService, AvailabilityLoggingService, AuthService } from '../../shared/services';
import { StartupInfo } from '../../shared/models/portal';


@Component({
    templateUrl: 'perf-analysis.component.html',
    styleUrls: ['custom.css'],
    animations: [
        trigger(
            'loadingAnimation',
            [
                state('shown', style({
                    opacity: 1
                })),
                state('hidden', style({
                    opacity: 0
                })),
                transition('* => *', animate('.5s'))
            ]
        )
    ]
})
export class PerfAnalysisComponent implements OnInit {

    showLast24Hours: boolean = true;
    isHealthyNow: boolean = false;
    loadingAnalysis: boolean = true;

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    siteLatencyResponse: IDetectorResponse;
    serviceHealthResponse: IDetectorResponse;
    runtimeAvailabilityResponse: IDetectorResponse;
    analysisResponse: IAppAnalysisResponse;

    showToolsDropdown: boolean = false;
    metSLA: boolean;
    abnormalTimePeriods: IAbnormalTimePeriod[];
    selectedTimePeriodIndex: number;

    topLevelGraphRefreshIndex: number = 0;

    showLoadingMessage: boolean;
    loadingMessages: string[] = [
        "Running Performance Analysis",
        "Analyzing Long Runnning Requests",
        "Measuring CPU Usage",
        "Analyzing Memory Consumption",
        "Checking Application Events",
        "Finding Solutions",
        "Compiling Results"
    ]
    loadingMessageIndex: number;
    loadingMessageTimer: any;

    bladeOpenedFromSupportTicketFlow: boolean;

    constructor(private _route: ActivatedRoute, private _appAnalysisService: AppAnalysisService, private _serverFarmService: ServerFarmDataService, private _logger: AvailabilityLoggingService, private _authService: AuthService) {
        this._logger.LogAnalysisInitialized('Perf Analysis');
        this.startLoadingMessage();

        this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
            this.bladeOpenedFromSupportTicketFlow = startupInfo.source !== undefined && startupInfo.source.toLowerCase() === 'casesubmission';
            this.showLast24Hours = true;
        });
    }

    startLoadingMessage(): void {
        let self = this;
        this.loadingMessageIndex = 0;
        this.showLoadingMessage = true;

        setTimeout(() => {
            self.showLoadingMessage = false;
        }, 3000)
        this.loadingMessageTimer = setInterval(() => {
            self.loadingMessageIndex++;
            self.showLoadingMessage = true;

            if (self.loadingMessageIndex === self.loadingMessages.length - 1) {
                clearInterval(this.loadingMessageTimer);
                return;
            }

            setTimeout(() => {
                self.showLoadingMessage = false;
            }, 3000)
        }, 4000);
    }

    ngOnInit(): void {
        let self = this;
        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

        this._loadData();
    }

    onRefreshClicked(): void {
        this.loadingAnalysis = true;
        this.siteLatencyResponse = null;
        this.serviceHealthResponse = null;
        this.abnormalTimePeriods = null;
        this.analysisResponse = null;

        this.topLevelGraphRefreshIndex++;

        this.startLoadingMessage();

        this._loadData(true);
    }

    selectDowntime(index: number): void {
        this.selectedTimePeriodIndex = index;
    }

    private _loadData(invalidateCache: boolean = false): void {

        let self = this;
        
        this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'sitelatency', invalidateCache).subscribe(data => {
            self.siteLatencyResponse = data;
        });

        this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'servicehealth', invalidateCache).subscribe(data => {
            self.serviceHealthResponse = data;
        });

        this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'runtimeavailability', invalidateCache).subscribe(data => {
            self.runtimeAvailabilityResponse = data;
        });

        this._appAnalysisService.getAnalysisResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'perfanalysis', invalidateCache)
            .subscribe(data => {
                this.loadingAnalysis = false;
                clearInterval(self.loadingMessageTimer);
                setTimeout(() => {
                    self.analysisResponse = data;
                    if (self.analysisResponse && self.analysisResponse.abnormalTimePeriods) {
                        if (self.analysisResponse.abnormalTimePeriods.length > 0) {
                            self.abnormalTimePeriods = self.analysisResponse.abnormalTimePeriods;
                            self.selectedTimePeriodIndex = self.abnormalTimePeriods.length - 1;
                        }
                        else {
                            self.selectedTimePeriodIndex = -1;
                        }
                    }

                }, 500);
            });

        // Ideally we want to put this call on startup. We can't put this call in logging service as that will create a cyclic dependency.
        this._appAnalysisService.getDiagnosticProperties(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, invalidateCache).subscribe(data => {
            if (data && data.appStack) {
                self._logger.appStackInfo = data.appStack;
            }
        });
    }
}