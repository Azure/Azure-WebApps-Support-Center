import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { IAppAnalysisResponse, IAbnormalTimePeriod } from '../../shared/models/appanalysisresponse';
import { IDetectorAbnormalTimePeriod, IDetectorResponse } from '../../shared/models/detectorresponse';
import { INameValuePair } from '../../shared/models/namevaluepair';
import { ActivatedRoute, Router } from '@angular/router';
import { SolutionFactory } from '../../shared/models/solution-ui-model/solutionfactory';
import { SupportBladeDefinitions } from '../../shared/models/portal';
import { ObservationsComponent } from './observations.component';
import { AvailabilityLoggingService } from '../../shared/services/logging/availability.logging.service';
import { SiteService } from '../../shared/services/site.service';
import { DetectorViewStateService } from '../../shared/services/detector-view-state.service';
import { PortalActionService } from '../../shared/services/portal-action.service';

@Component({
    selector: 'observations-performance',
    templateUrl: 'observations-performance.component.html',
    styleUrls: ['observations.component.css']
})
export class ObservationsPerformanceComponent extends ObservationsComponent implements OnInit, OnChanges {

    constructor(protected _route: ActivatedRoute, protected _router: Router, protected _portalActionService: PortalActionService, 
        protected _logger: AvailabilityLoggingService, protected _siteService: SiteService, protected _detectorViewService: DetectorViewStateService) {
        super(_route, _router, _portalActionService, _logger, _siteService, _detectorViewService);
    }

    ngOnInit(): void {
        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];

        this.analysisResponse.abnormalTimePeriods.forEach((abnormalTimePeriod: IAbnormalTimePeriod) => {
            let mainMessage = "";
            let secondaryMessage = "";

            mainMessage = "We detected your app response time's 50th percentile taking more than 10 seconds from " +
                this.formatDateTime(new Date(abnormalTimePeriod.startTime)) + " to " +
                this.formatDateTime(new Date(abnormalTimePeriod.endTime)) + " UTC";

            if (abnormalTimePeriod.events.length < 1) {
                secondaryMessage = "No observations found for this time period."
            }
            
            this.downtimesViewModel.push({
                mainMessage: mainMessage,
                secondaryMessage: secondaryMessage,
                currentlyDown: false,
                showDetails: true
            });

        });
    }

    ngOnChanges(changes: SimpleChanges): void {

        if (changes['selectedDowntimeIndex']) {
            // check if changes to index is not undefined and app analysis response is resolved 
            if (this.selectedDowntimeIndex >= 0 && this.analysisResponse) {

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

                this._logger.LogDowntimeVisitedSummary(selectedDowntime.startTime, selectedDowntime.endTime, false, observationSources, solutions);
            }
        }
    }
}