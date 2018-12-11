import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { IAppAnalysisResponse, IAbnormalTimePeriod } from '../../shared/models/appanalysisresponse';
import { IDetectorAbnormalTimePeriod, IDetectorResponse } from '../../shared/models/detectorresponse';
import { INameValuePair } from '../../shared/models/namevaluepair';
import { ActivatedRoute, Router } from '@angular/router';
import { SolutionFactory } from '../../shared/models/solution-ui-model/solutionfactory';
import { SupportBladeDefinitions } from '../../shared/models/portal';
import { AvailabilityLoggingService } from '../../shared/services/logging/availability.logging.service';
import { SiteService } from '../../shared/services/site.service';
import { DetectorViewStateService } from '../../shared/services/detector-view-state.service';
import { PortalActionService } from '../../shared/services/portal-action.service';

@Component({
    selector: 'app-observations',
    template: '',
    styleUrls: ['observations.component.scss']
})
export class ObservationsComponent {

    @Input() analysisResponse: IAppAnalysisResponse;
    @Input() selectedDowntimeIndex: number;
    @Input() openedFromTicketFlow: boolean;
    @Input() showMoreDetailsLink: boolean = true;

    observationLimit: number = 2;
    allObservationsShown: boolean = false;

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;

    currentlyDown: boolean;

    downtimesViewModel: any[];

    constructor(protected _route: ActivatedRoute, protected _router: Router, protected _portalActionService: PortalActionService, 
        protected _logger: AvailabilityLoggingService, protected _siteService: SiteService, protected _detectorViewService: DetectorViewStateService) {
        this.downtimesViewModel = [];
    }

    protected formatDateTime(datetime: Date): string {
        // TODO: this is a hack and there has to be a better way
        let hours = datetime.getUTCHours();
        let hoursString = hours < 10 ? '0' + hours : hours;
        let minutes = datetime.getUTCMinutes();
        let minutesString = minutes < 10 ? '0' + minutes : minutes;
        return (datetime.getUTCMonth() + 1) + '/' + datetime.getUTCDate() + ' ' + hoursString + ':' + minutesString;
    }

    protected getDowntimeShortName(abnormalTimePeriod: IDetectorAbnormalTimePeriod): string {
        if (abnormalTimePeriod.metaData && abnormalTimePeriod.metaData.length > 0) {
            abnormalTimePeriod.metaData.forEach((set: INameValuePair[]) => {
                if (set && set.length > 0) {
                    set.forEach((nameValuePair: INameValuePair) => {
                        if (nameValuePair.name == "IssueShortName") {
                            return nameValuePair.value;
                        }
                    });
                }
            });
        }

        return this.getIssueTypeTag(abnormalTimePeriod.source).title;
    }

    protected showDetectorViewLink(source: string): any {

        switch (source.toLowerCase()) {
            case 'servicehealth':
                return false;
        }

        return true;
    }

    protected logShowDetails(): void {
        this._logger.LogClickEvent("Show/Hide Details", "Observations");
    }

    protected detectorViewClick(downtime: IDetectorAbnormalTimePeriod){
        let isDownNow = this.currentlyDown && this.selectedDowntimeIndex === this.analysisResponse.abnormalTimePeriods.length - 1 ? "true" : "false";
        this._logger.LogClickEvent("Open Detector View", "Observations");
        this._logger.LogDetectorViewOpened(downtime.source, downtime.priority, downtime.startTime, downtime.endTime, isDownNow);

        this._detectorViewService.setDetectorViewState(downtime);
        
        this._router.navigate(['../detectors/' + downtime.source], { relativeTo: this._route });
    }

    protected getIssueTypeTag(source: string): any {

        var tag = {
            icon: '',
            title: ''
        };

        switch (source.toLowerCase()) {
            case 'servicehealth':
                tag.title = 'A service incident';
                break;
            case 'siteswap':
                tag.title = 'A site swap operation';
                break;
            case 'deployment':
                tag.title = 'A site deployment';
                break;
            case 'siterestartuserinitiated':
                tag.title = 'A user initiated a site restart';
                break;
            case 'siterestartsettingupdate':
                tag.title = 'A setting updated initiated a site restart';
                break;
            case 'sitecpuanalysis':
                tag.title = 'High CPU';
                break;
            case 'sitememoryanalysis':
                tag.title = 'High Memory';
                break;
            case 'sitelatency':
                tag.title = 'High Latency';
                break;
            case 'frebanalysis':
                tag.title = 'Application errors';
                break;
            case 'aspnetcore':
                tag.title = 'ASP.NET Core startup issue';
                break;
            case 'threadcount':
                tag.title = 'High thread count'
                break;
            case 'sitecrashes':
                tag.title = 'An app crash';
                break;
            default:
                tag.title = 'An App Issue'
                break;
        }

        return tag;
    }
}