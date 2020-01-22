import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { DetectorControlService } from '../../services/detector-control.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DiagnosticService } from '../../services/diagnostic.service';
import { forkJoin as observableForkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DetectorMetaData, DetectorResponse, DiagnosticData, DetectorType, HealthStatus, RenderingType, DetectorListRendering } from '../../models/detector';
import { Moment } from 'moment';
import { v4 as uuid } from 'uuid';
import { LoadingStatus } from '../../models/loading';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { Solution } from '../solution/solution';
import { InsightUtils, Insight } from '../../models/insight';
import { StatusStyles } from '../../models/styles';
@Component({
    selector: 'detector-search',
    templateUrl: './detector-search.component.html',
    styleUrls: ['./detector-search.component.scss'],
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
                transition('* => *', animate('.3s'))
            ]
        )
    ]
})
export class DetectorSearchComponent extends DataRenderBaseComponent implements OnInit {
    startTime: Moment;
    endTime: Moment;
    isPublic: boolean = false;
    searchTerm: string = '';
    searchTermDisplay: string = '';
    searchId: string = '';
    showPreLoader: boolean = false;
    preLoadingErrorMessage: string = "Some error occurred while fetching diagnostics."
    showPreLoadingError: boolean = false;
    showSearchTermPractices: boolean = false;

    detectors: any[] = [];
    detectorViewModels: any[];
    issueDetectedViewModels: any[] = [];
    successfulViewModels: any[] = [];
    allSolutions: Solution[] = [];
    detectorMetaData: DetectorMetaData[];
    private childDetectorsEventProperties = {};

    detectorId: string = "";
    detectorResponse: DetectorResponse;

    loadingChildDetectors: boolean = false;
    loadingMessages: string[] = [];
    loadingMessageIndex: number = 0;
    loadingMessageTimer: any;
    showLoadingMessage: boolean = false;

    showSuccessfulChecks: boolean = false;

    firstLoad: boolean = true;

    webSearchResults: any[] = [];

    @Input()
    withinDiagnoseAndSolve: boolean = false;
    @Input() detector: string = '';

    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private _diagnosticService: DiagnosticService, public telemetryService: TelemetryService,
        private detectorControlService: DetectorControlService, private _activatedRoute: ActivatedRoute, private _router: Router) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;
    }
    childDetectorsData: string = "";

    ngOnInit() {
        this.detectorControlService.update.subscribe(isValidUpdate => {
            if (isValidUpdate) {
                this.refresh();
            }
        });

        this._activatedRoute.queryParamMap.subscribe(qParams => {
            if (!this.firstLoad) {
                return;
            }
            this.searchTerm = qParams.get('searchTerm') === null ? "" || this.searchTerm : qParams.get('searchTerm');
            this.refresh();
        });

        this.startTime = this.detectorControlService.startTime;
        this.endTime = this.detectorControlService.endTime;
    }

    refresh() {
        if (!this.detectorId && this.searchTerm && this.searchTerm.length > 1) {
            this.triggerSearch();
        }
    }

    handleRequestFailure() {
        this.showPreLoadingError = true;
        this.showSearchTermPractices = false;
    }

    triggerSearch() {
        this.firstLoad = false;
        const queryParams: Params = { searchTerm: this.searchTerm };
        this._router.navigate(
            [],
            {
                relativeTo: this._activatedRoute,
                queryParams: queryParams,
                queryParamsHandling: 'merge'
            }
        );
        this.resetGlobals();
        this.searchId = uuid();
        let searchTask = this._diagnosticService.getDetectorsSearch(this.searchTerm).pipe(map((res) => res), catchError(e => {
            this.handleRequestFailure();
            return of([]);
        }));
        let detectorsTask = this._diagnosticService.getDetectors().pipe(map((res) => res), catchError(e => {
            this.handleRequestFailure();
            return of([]);
        }));
        let childrenTask = this.getChildrenOfParentDetector(this.detector).pipe(map((res) => res), catchError(e => {
            this.handleRequestFailure();
            return of([]);
        }));
        this.showPreLoader = true;
        observableForkJoin([searchTask, detectorsTask, childrenTask]).subscribe(results => {
            this.showPreLoader = false;
            var searchResults: DetectorMetaData[] = results[0];
            this.logEvent(TelemetryEventNames.SearchQueryResults, { parentDetectorId: this.detector, searchId: this.searchId, query: this.searchTerm, results: JSON.stringify(searchResults.map((det: DetectorMetaData) => new Object({ id: det.id, score: det.score }))), ts: Math.floor((new Date()).getTime() / 1000).toString() });
            var detectorList = results[1];
            var childrenOfParent = results[2];
            if (detectorList) {
                searchResults.forEach(result => {
                    if ((result.id !== this.detector) && (childrenOfParent.findIndex((x: string) => x.toLowerCase() == result.id.toLowerCase()) < 0) && (result.type === DetectorType.Detector)) {
                        this.insertInDetectorArray({ name: result.name, id: result.id, score: result.score });
                    }
                    else if (result.type === DetectorType.Analysis) {
                        var childList = this.getChildrenOfAnalysis(result.id, detectorList);
                        if (childList && childList.length > 0) {
                            childList.forEach((child: DetectorMetaData) => {
                                this.insertInDetectorArray({ name: child.name, id: child.id, score: result.score });
                            });
                        }
                        this.insertInDetectorArray({ name: result.name, id: result.id, score: result.score });
                    }
                });
                this.startDetectorRendering(detectorList);
            }
        },
            (err) => {
                this.showPreLoader = false;
                this.handleRequestFailure();
            });
    }

    startDetectorRendering(detectorList) {
        this.detectorMetaData = detectorList.filter(detector => this.detectors.findIndex(d => d.id === detector.id) >= 0);
        if (this.detectorMetaData.length === 0) { this.showSearchTermPractices = true; this.searchTermDisplay = this.searchTerm.valueOf(); }
        else { this.showSearchTermPractices = false; }
        this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector));
        this.issueDetectedViewModels = [];

        const requests: Observable<any>[] = [];
        if (this.detectorViewModels.length > 0) {
            this.loadingChildDetectors = true;
            this.startLoadingMessage();
        }
        this.detectorViewModels.forEach((metaData, index) => {

            requests.push((<Observable<DetectorResponse>>metaData.request).pipe(
                map((response: DetectorResponse) => {
                    this.detectorViewModels[index] = this.updateDetectorViewModelSuccess(metaData, response);

                    if (this.detectorViewModels[index].loadingStatus !== LoadingStatus.Failed) {
                        if (this.detectorViewModels[index].status === HealthStatus.Critical || this.detectorViewModels[index].status === HealthStatus.Warning) {
                            let insight = this.getDetectorInsight(this.detectorViewModels[index]);
                            let issueDetectedViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description, detectorResponse: response };
                            this.issueDetectedViewModels.push(issueDetectedViewModel);
                            this.issueDetectedViewModels = this.issueDetectedViewModels.sort((n1, n2) => n1.model.status - n2.model.status);
                        } else {
                            let insight = this.getDetectorInsight(this.detectorViewModels[index]);
                            let successViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description, detectorResponse: response };
                            this.successfulViewModels.push(successViewModel);
                        }
                    }

                    return {
                        'ChildDetectorName': this.detectorViewModels[index].title,
                        'ChildDetectorId': this.detectorViewModels[index].metadata.id,
                        'ChildDetectorStatus': this.detectorViewModels[index].status,
                        'ChildDetectorLoadingStatus': this.detectorViewModels[index].loadingStatus
                    };
                })
                , catchError(err => {
                    this.detectorViewModels[index].loadingStatus = LoadingStatus.Failed;
                    return of({});
                })
            ));
        });

        // Log all the children detectors
        observableForkJoin(requests).subscribe(childDetectorData => {
            this.childDetectorsEventProperties['ChildDetectorsList'] = JSON.stringify(childDetectorData);
            this.childDetectorsEventProperties['SearchId'] = this.searchId;
            this.childDetectorsEventProperties['ParentDetectorId'] = this.detector;
            this.logEvent(TelemetryEventNames.ChildDetectorsSummary, this.childDetectorsEventProperties);
        });
    }


    //Helper Functions
    toggleSuccessfulChecks() {
        this.showSuccessfulChecks = !this.showSuccessfulChecks;
    }

    clearSearchTerm() {
        this.searchTerm = "";
    }

    getChildrenOfAnalysis(analysisId, detectorList) {
        return detectorList.filter(element => (element.analysisTypes != null && element.analysisTypes.length > 0 && element.analysisTypes.findIndex(x => x == analysisId) >= 0)).map(element => { return { name: element.name, id: element.id }; });
    }

    getChildrenOfParentDetector(parentDetectorId) {
        if (!parentDetectorId) { return of([]); }
        return (<Observable<DetectorResponse>>this._diagnosticService.getDetector(parentDetectorId, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString)).pipe(map((response: DetectorResponse) => {
            let detectorList = [];
            response.dataset.forEach((ds: DiagnosticData) => {
                if (ds.renderingProperties.type === RenderingType.DetectorList)
                    detectorList = (<DetectorListRendering>ds.renderingProperties).detectorIds;
            });
            return detectorList;
        }), catchError(e => of([])));
    }

    insertInDetectorArray(detectorItem) {
        if (this.detectors.findIndex(x => x.id === detectorItem.id) < 0) {
            this.detectors.push(detectorItem);
            this.loadingMessages.push("Checking " + detectorItem.name);
        }
    }

    getPendingDetectorCount(): number {
        let pendingCount = 0;
        if (this.detectorViewModels) {
            this.detectorViewModels.forEach((metaData, index) => {
                if (this.detectorViewModels[index].loadingStatus == LoadingStatus.Loading) {
                    ++pendingCount;
                }
            });
        }
        return pendingCount;
    }

    resetGlobals() {
        this.detectors = [];
        this.detectorMetaData = [];
        this.detectorViewModels = [];
        this.issueDetectedViewModels = [];
        this.loadingChildDetectors = false;
        this.allSolutions = [];
        this.loadingMessages = [];
        this.successfulViewModels = [];
        this.detectorId = "";
        this.detectorResponse = null;
        this.showSuccessfulChecks = false;
        this.showSearchTermPractices = false;
        this.showPreLoadingError = false;
    }

    getDetectorInsight(viewModel: any): any {
        let allInsights: Insight[] = InsightUtils.parseAllInsightsFromResponse(viewModel.response);
        let insight: any;
        if (allInsights.length > 0) {

            let description = null;
            if (allInsights[0].hasData()) {
                description = allInsights[0].data["Description"];
            }
            insight = { title: allInsights[0].title, description: description };

            // now populate solutions for all the insights
            allInsights.forEach(i => {
                if (i.solutions != null) {
                    i.solutions.forEach(s => {
                        if (this.allSolutions.findIndex(x => x.Name === s.Name) === -1) {
                            this.allSolutions.push(s);
                        }
                    });
                }
            });
        }

        return insight;
    }

    private updateDetectorViewModelSuccess(viewModel: any, res: DetectorResponse) {
        const status = res.status.statusId;

        viewModel.loadingStatus = LoadingStatus.Success,
            viewModel.status = status;
        viewModel.statusColor = StatusStyles.getColorByStatus(status),
            viewModel.statusIcon = StatusStyles.getIconByStatus(status),
            viewModel.response = res;
        return viewModel;
    }

    private getDetectorViewModel(detector: DetectorMetaData) {
        return {
            title: detector.name,
            metadata: detector,
            loadingStatus: LoadingStatus.Loading,
            status: null,
            statusColor: null,
            statusIcon: null,
            expanded: false,
            response: null,
            request: this._diagnosticService.getDetector(detector.id, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString)
        };
    }

    public selectDetector(viewModel: any) {
        if (viewModel != null && viewModel.model.metadata.id) {
            let detectorId = viewModel.model.metadata.id;
            if (detectorId !== "") {

                const clickDetectorEventProperties = {
                    'ChildDetectorName': viewModel.model.title,
                    'ChildDetectorId': viewModel.model.metadata.id,
                    'IsExpanded': true,
                    'Status': viewModel.model.status
                };

                this.logEvent(TelemetryEventNames.SearchResultClicked, { parentDetectorId: this.detector, searchId: this.searchId, detectorId: detectorId, rank: 0, title: clickDetectorEventProperties.ChildDetectorName, status: clickDetectorEventProperties.Status, ts: Math.floor((new Date()).getTime() / 1000).toString() });
                this.detectorId = detectorId;
                this.detectorResponse = viewModel.detectorResponse;
            }
        }
    }

    goBackToSearch() {
        this.detectorId = "";
        this.detectorResponse = null;
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

}
