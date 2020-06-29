import { Component, Input, OnInit } from '@angular/core';
import { IAppAnalysisResponse } from '../../shared/models/appanalysisresponse';
import { IDetectorAbnormalTimePeriod } from '../../shared/models/detectorresponse';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs'
import { ISolution } from '../../shared/models/solution';
import { AvailabilityLoggingService } from '../../shared/services/logging/availability.logging.service';
import { DetectorViewStateService } from '../../shared/services/detector-view-state.service';
import { AppInsightsService } from '../../shared/services/appinsights/appinsights.service';

@Component({
    selector: 'problem-solution',
    templateUrl: 'problem-solution.component.html',
    styleUrls: ['problem-solution.component.scss']
})
export class ProblemSolutionComponent implements OnInit {

    public appInsightsValid: boolean = true;

    public loading: boolean = true;    

    public analysisResponseSubject: BehaviorSubject<IAppAnalysisResponse> = new BehaviorSubject<IAppAnalysisResponse>(null);
    public analysisResponse: IAppAnalysisResponse;

    @Input() set analysisResponseInput(analysisResponse: IAppAnalysisResponse) {
        this.analysisResponseSubject.next(analysisResponse);
    }

    private selectedTimePeriodIndexSubject: BehaviorSubject<number> = new BehaviorSubject<number>(null);
    private selectedTimePeriodIndex: number;

    @Input() set selectedTimePeriodIndexInput(selectedTimePeriodIndex: number) {
        this.selectedTimePeriodIndexSubject.next(selectedTimePeriodIndex);
    }

    @Input() defaultSolutions: ISolution[];
    @Input() openedFromTicketOpeningFlow: boolean = false;
    @Input() showAppInsights: boolean = false;
    @Input() problemDescription: string;
    @Input() parentContainer: string;

    constructor(private _route: ActivatedRoute, private _router: Router, private _logger: AvailabilityLoggingService, 
        private _detectorViewService: DetectorViewStateService, private _appInightsService: AppInsightsService) {

            this._appInightsService.applicationInsightsValidForApp.subscribe(valid => this.appInsightsValid = valid );
    }

    ngOnInit(): void {
        this.analysisResponseSubject.subscribe((analysisResponse: IAppAnalysisResponse) => {
            if (analysisResponse) {
                this.analysisResponse = analysisResponse;
            }
        });

        this.selectedTimePeriodIndexSubject.subscribe((selectedTimePeriodIndex: number) => {
            if (selectedTimePeriodIndex !== undefined) {
                this.selectedTimePeriodIndex = selectedTimePeriodIndex;
            }
        });
    }

    protected detectorViewClick(downtime: IDetectorAbnormalTimePeriod){
        this._logger.LogClickEvent("Open Detector View", "Observations");
        this._logger.LogDetectorViewOpened(downtime.source, downtime.priority, downtime.startTime, downtime.endTime, '');

        this._detectorViewService.setDetectorViewState(downtime);
        
        this._router.navigate(['../detectors/' + downtime.source], { relativeTo: this._route });
    }

    protected formatDateTime(datetime: Date): string {
        // TODO: this is a hack and there has to be a better way
        let hours = datetime.getUTCHours();
        let hoursString = hours < 10 ? '0' + hours : hours;
        let minutes = datetime.getUTCMinutes();
        let minutesString = minutes < 10 ? '0' + minutes : minutes;
        return (datetime.getUTCMonth() + 1) + '/' + datetime.getUTCDate() + ' ' + hoursString + ':' + minutesString;
    }

    getIssueTypeTag(source: string): any {
        let title: string;
        switch (source.toLowerCase()) {
            case 'servicehealth':
                title = 'Service Incident';
                break;
            case 'siteswap':
                title = 'Slot Swap';
                break;
            case 'deployment':
                title = 'Deployment';
                break;
            case 'siterestartuserinitiated':
                title = 'App Restart';
                break;
            case 'siterestartsettingupdate':
                title = 'App Restart';
                break;
            case 'sitecpuanalysis':
                title = 'High CPU';
                break;
            case 'sitememoryanalysis':
                title = 'High Memory';
                break;
            case 'sitelatency':
                title = 'High Latency';
                break;
            case 'frebanalysis':
                title = 'Application Errors';
                break;
            case 'aspnetcore':
                title = 'ASP.NET Core Startup Issue';
                break;
            case 'threadcount':
                title = 'High Thread Count'
                break;
            case 'sitecrashes':
                title = 'App Crash';
                break;
            case 'failedrequestsperuri':
                title = 'Failed Urls';
                break;
            case 'pagefileoperations':
            case 'committedmemoryusage':
                title = 'Memory Issue';
                break;
            case 'autoheal':
                title = 'Auto-Heal';
                break;
            default:
                title = 'App Issue'
                break;
        }
        return title;
    }

}