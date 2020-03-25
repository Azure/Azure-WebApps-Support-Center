import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import { IAppAnalysisResponse } from '../../shared/models/appanalysisresponse';
import { IDetectorResponse, IMetricSet } from '../../shared/models/detectorresponse';
import { IAbnormalTimePeriod } from '../../shared/models/appanalysisresponse';
import { StartupInfo } from '../../shared/models/portal';
import { AppAnalysisService } from '../../shared/services/appanalysis.service';
import { ServerFarmDataService } from '../../shared/services/server-farm-data.service';
import { AvailabilityLoggingService } from '../../shared/services/logging/availability.logging.service';
import { AuthService } from '../../startup/services/auth.service';
import { DetectorControlService } from 'diagnostic-data';
import { Subscription } from 'rxjs/internal/Subscription';


@Component({
    templateUrl: 'app-analysis.component.html',
    styleUrls: ['custom.scss'],
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
export class AppAnalysisComponent implements OnInit, OnDestroy {

    showLast24Hours: boolean = true;
    isHealthyNow: boolean = false;
    loadingAnalysis: boolean = true;

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    runtimeAvailabilitySubscription: Subscription;
    analysisResponseSubscription: Subscription;

    runtimeAvailabilityResponse: IDetectorResponse;
    analysisResponse: IAppAnalysisResponse;

    showToolsDropdown: boolean = false;
    abnormalTimePeriods: IAbnormalTimePeriod[];
    selectedTimePeriodIndex: number;

    showLoadingMessage: boolean;
    loadingMessages: string[] = [
        "Running Application Analysis",
        "Diagnosing Failed Requests",
        "Measuring CPU Usage",
        "Analyzing Memory Consumption",
        "Checking Application Events",
        "Finding Solutions",
        "Compiling Results"
    ]
    loadingMessageIndex: number;
    loadingMessageTimer: any;

    problemDescription: string = 'availability loss';

    bladeOpenedFromSupportTicketFlow: boolean;

    refreshSubscription: Subscription;

    constructor(private _route: ActivatedRoute, private _appAnalysisService: AppAnalysisService, private _serverFarmService: ServerFarmDataService, private _logger: AvailabilityLoggingService, 
        private _authService: AuthService, private _detectorControlService: DetectorControlService) {
        this._logger.LogAnalysisInitialized('App Analysis');
        this.startLoadingMessage();

        this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
            this.bladeOpenedFromSupportTicketFlow = startupInfo.source !== undefined && startupInfo.source.toLowerCase() === 'casesubmission';
            this.showLast24Hours = !this.bladeOpenedFromSupportTicketFlow;
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
        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['resourcename']
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

        this.refreshSubscription = this._detectorControlService.update.subscribe(isValidUpdate => {
            if (isValidUpdate) {
                this.refresh();
            }
        });

        this._loadData();
    }

    ngOnDestroy() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
        }
        
        this._clearRequestSubscriptions();
    }

    refresh(): void {
        this.loadingAnalysis = true;
        this.runtimeAvailabilityResponse = null;
        this.abnormalTimePeriods = null;
        this.analysisResponse = null;

        this._clearRequestSubscriptions();

        this.startLoadingMessage();

        this._loadData(true);
    }

    private _clearRequestSubscriptions() {
        if (this.runtimeAvailabilitySubscription) {
            this.runtimeAvailabilitySubscription.unsubscribe();
        }
        
        if (this.analysisResponseSubscription) {
            this.analysisResponseSubscription.unsubscribe();
        }
    }

    selectDowntime(index: number): void {
        this.selectedTimePeriodIndex = index;
    }

    private _loadData(invalidateCache: boolean = false): void {
        this.runtimeAvailabilitySubscription = this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'runtimeavailability', invalidateCache)
        .subscribe(data => {
            this.runtimeAvailabilityResponse = data;
            if (this.runtimeAvailabilityResponse && this.runtimeAvailabilityResponse.data && this.runtimeAvailabilityResponse.data.length > 0) {
                let currentAppHealth = this.runtimeAvailabilityResponse.data[0].find(p => p.name.toLowerCase() === "currentapphealth");
                if (currentAppHealth && currentAppHealth.value.toLowerCase() === 'unhealthy') {
                    this.showLast24Hours = !this.bladeOpenedFromSupportTicketFlow;
                    this.isHealthyNow = true;
                }
                else {
                    this.showLast24Hours = true;
                    this.isHealthyNow = false;
                }
            }
        });

        this.analysisResponseSubscription = this._appAnalysisService.getAnalysisResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'appanalysis', invalidateCache,
            this._detectorControlService.startTimeString, this._detectorControlService.endTimeString)
        .subscribe(data => {
            this.loadingAnalysis = false;
            clearInterval(this.loadingMessageTimer);
            setTimeout(() => {
                this.analysisResponse = data;
                if (this.analysisResponse && this.analysisResponse.abnormalTimePeriods) {
                    if (this.analysisResponse.abnormalTimePeriods.length > 0) {
                        this.abnormalTimePeriods = this.analysisResponse.abnormalTimePeriods;
                        this.selectedTimePeriodIndex = this.abnormalTimePeriods.length - 1;
                    }
                    else {
                        this.selectedTimePeriodIndex = -1;
                    }
                }

            }, 500);
        });
    }
}