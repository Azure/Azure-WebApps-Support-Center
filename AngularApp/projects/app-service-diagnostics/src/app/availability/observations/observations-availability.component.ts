import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { IAppAnalysisResponse, IAbnormalTimePeriod } from '../../shared/models/appanalysisresponse';
import { IDetectorAbnormalTimePeriod, IDetectorResponse } from '../../shared/models/detectorresponse';
import { INameValuePair } from '../../shared/models/namevaluepair';
import { ActivatedRoute, Router } from '@angular/router';
import { SolutionFactory } from '../../shared/models/solution-ui-model/solutionfactory';
import { SupportBladeDefinitions } from '../../shared/models/portal';
import { ObservationsComponent } from './observations.component';
import { PortalActionService } from '../../shared/services/portal-action.service';
import { DetectorViewStateService } from '../../shared/services/detector-view-state.service';
import { SiteService } from '../../shared/services/site.service';
import { AvailabilityLoggingService } from '../../shared/services/logging/availability.logging.service';

@Component({
    selector: 'observations-availability',
    templateUrl: 'observations-availability.component.html',
    styleUrls: ['observations.component.scss']
})
export class ObservationsAvailabilityComponent extends ObservationsComponent implements OnInit, OnChanges {

    @Input() runtimeAvailabilityResponse: IDetectorResponse;

    observationLimit: number = 2;
    allObservationsShown: boolean = false;

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;

    currentlyDown: boolean;

    downtimesViewModel: any[];

    constructor(protected _route: ActivatedRoute, protected _router: Router, protected _portalActionService: PortalActionService, 
        protected _logger: AvailabilityLoggingService, protected _siteService: SiteService, protected _detectorViewService: DetectorViewStateService) {
        super(_route, _router, _portalActionService, _logger, _siteService, _detectorViewService);
    }

    ngOnInit(): void {
        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['resourcename'];
        let currentAppHealth = this.runtimeAvailabilityResponse.data[0].find(p => p.name.toLocaleLowerCase() === "currentapphealth");
        let currentlyDownString = currentAppHealth ? currentAppHealth.value.toLocaleLowerCase() : "healthy";

        this.analysisResponse.abnormalTimePeriods.forEach((abnormalTimePeriod: IAbnormalTimePeriod) => {
            let mainMessage = "";
            let secondaryMessage = "";
            this.currentlyDown = false;

            if (abnormalTimePeriod.endTime === this.analysisResponse.endTime && currentlyDownString === 'unhealthy') {

                this.currentlyDown = true;
                mainMessage = "Your app is unhealthy right now";

                if (abnormalTimePeriod.events.length > 0) {

                    let topDetector = abnormalTimePeriod.events[0];
                    let detectorCount = abnormalTimePeriod.events.length;

                    let detectorDescription = this.getDowntimeShortName(topDetector);

                    secondaryMessage = detectorDescription +
                        (detectorCount > 1 ? " and " + (detectorCount - 1) + " other events " : " ") + "detected.";
                }
                else {
                    // If downtime is shorter than 10 minutes it means that we created the downtime because of pulse, not kusto
                    if ((new Date(abnormalTimePeriod.endTime).getTime() - new Date(abnormalTimePeriod.startTime).getTime()) / 60000 < 10) {
                        secondaryMessage = "Your app has just begun experiencing failed requests and we do not yet have any observations. Please wait 5 to 10 minutes or try the default troubleshooting steps below."
                        this._logger.LogMessage("App down right now and no observations yet. Pulse reported downtime.");
                    }
                    else {
                        secondaryMessage = "No observations were found for this downtime. Sometimes observations can take time to propogate in the system. You can try waiting a few minutes and hitting the refresh button in the top right or exploring the default troubleshooting steps below."
                    }
                }
            }
            else {
                this.currentlyDown = false;
                mainMessage = "We detected an availability loss from " +
                    this.formatDateTime(new Date(abnormalTimePeriod.startTime)) + " to " +
                    this.formatDateTime(new Date(abnormalTimePeriod.endTime)) + " UTC";

                if (abnormalTimePeriod.events.length < 1) {
                    secondaryMessage = "No observations found for this time period."
                }
            }

            this.downtimesViewModel.push({
                mainMessage: mainMessage,
                secondaryMessage: secondaryMessage,
                currentlyDown: this.currentlyDown,
                showDetails: true
            });

        });
    }

    ngOnChanges(changes: SimpleChanges): void {

        if (changes['selectedDowntimeIndex']) {

            // check if changes to index is not undefined and app analysis response is resolved 
            if (this.selectedDowntimeIndex >= 0 && this.analysisResponse && this.runtimeAvailabilityResponse) {

                let selectedDowntime: IAbnormalTimePeriod = this.analysisResponse.abnormalTimePeriods[this.selectedDowntimeIndex];
                let observationSources: string[] = selectedDowntime.events.map(p => p.source);
                let solutionIds: number[] = selectedDowntime.solutions.map(p => p.id);
                let solutions: string[] = [];

                for (let id of solutionIds) {
                    var solutionModel = SolutionFactory.getSolutionById(0, id, [], this._siteService, this._portalActionService, this._logger);
                    if (solutionModel) {
                        solutions.push(solutionModel.properties.title);
                    }
                }

                let currentAppHealth = this.runtimeAvailabilityResponse.data[0].find(p => p.name.toLocaleLowerCase() === "currentapphealth");
                let currentlyDownString = currentAppHealth ? currentAppHealth.value.toLocaleLowerCase() : "healthy";
                let currentlyDown = false;

                if (selectedDowntime.endTime === this.analysisResponse.endTime && currentlyDownString === 'unhealthy') {
                    currentlyDown = true;
                }

                this._logger.LogDowntimeVisitedSummary(selectedDowntime.startTime, selectedDowntime.endTime, currentlyDown, observationSources, solutions);
            }
        }
    }

    showAbnormalTimePeriodMetadata(downtime: IDetectorAbnormalTimePeriod): boolean {
        let allowedList = ["failedrequestsperuri",];
        return (downtime.metaData.length > 0 && allowedList.indexOf(downtime.source) > -1)
    } 
}