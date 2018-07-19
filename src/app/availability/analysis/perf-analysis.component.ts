import { Component, OnInit, trigger, state, animate, transition, style } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IAppAnalysisResponse } from '../../shared/models/appanalysisresponse';
import { IDetectorResponse, IMetricSet } from '../../shared/models/detectorresponse';
import { Observable } from 'rxjs/Observable';
import { IAbnormalTimePeriod } from '../../shared/models/appanalysisresponse';
import { StartupInfo } from '../../shared/models/portal';
import { ISolution } from '../../shared/models/solution';
import { SiteInfoMetaData } from '../../shared/models/site';
import { AppAnalysisService } from '../../shared/services/appanalysis.service';
import { ServerFarmDataService } from '../../shared/services/server-farm-data.service';
import { AvailabilityLoggingService } from '../../shared/services/logging/availability.logging.service';
import { AuthService } from '../../startup/services/auth.service';
import { SiteService } from '../../shared/services/site.service';


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

    problemDescription: string = 'high latency';

    defaultSolutions: ISolution[];

    bladeOpenedFromSupportTicketFlow: boolean;

    constructor(private _route: ActivatedRoute, private _appAnalysisService: AppAnalysisService, private _serverFarmService: ServerFarmDataService, 
        private _logger: AvailabilityLoggingService, private _authService: AuthService, private _siteService: SiteService) {
        this._logger.LogAnalysisInitialized('Perf Analysis');
        this.startLoadingMessage();

        this._siteService.currentSiteMetaData.subscribe(site => {
            this.defaultSolutions = this.getDefaultSolutions(site);
        });

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
    }

    private getDefaultSolutions(site: SiteInfoMetaData) {
        return [ 
            <ISolution>{ 
                id: 104,
                data: [
                    [
                        {
                            name: 'subscriptionid',
                            value: site.subscriptionId
                        },
                        {
                            name: 'resourcegroupname',
                            value: site.resourceGroupName
                        },
                        {
                            name: 'sitename',
                            value: site.siteName
                        }
                    ]
                ],
                order: 0
            } 
        ];
    }
}