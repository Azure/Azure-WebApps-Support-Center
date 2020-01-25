import { Moment } from 'moment';
import { v4 as uuid } from 'uuid';
import { Component, OnInit, Input, Inject } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { LoadingStatus } from '../../models/loading';
import { StatusStyles } from '../../models/styles';
import { DetectorControlService } from '../../services/detector-control.service';
import { DiagnosticService } from '../../services/diagnostic.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { Solution } from '../solution/solution';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin as observableForkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DetectorResponse, DetectorMetaData, HealthStatus, DetectorType } from '../../models/detector';
import { Insight, InsightUtils } from '../../models/insight';
import { DataTableResponseColumn, DataTableResponseObject, DiagnosticData, RenderingType, Rendering, TimeSeriesType, TimeSeriesRendering } from '../../models/detector';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { AppInsightsQueryService } from '../../services/appinsights.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AppInsightQueryMetadata, AppInsightData, BladeInfo } from '../../models/app-insights';
import { GenericSupportTopicService } from '../../services/generic-support-topic.service';


@Component({
    selector: 'detector-list-analysis',
    templateUrl: './detector-list-analysis.component.html',
    styleUrls: ['./detector-list-analysis.component.scss'],
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
export class DetectorListAnalysisComponent extends DataRenderBaseComponent implements OnInit {

    analysisId: string;
    detectorId: string;
    detectorName: string;
    contentHeight: string;
    detectors: any[] = [];
    LoadingStatus = LoadingStatus;
    detectorViewModels: any[];
    issueDetectedViewModels: any[] = [];
    successfulViewModels: any[] = [];
    detectorMetaData: DetectorMetaData[];
    private childDetectorsEventProperties = {};
    loadingChildDetectors: boolean = false;
    appInsights: any;
    allSolutions: Solution[] = [];
    loadingMessages: string[] = [];
    loadingMessageIndex: number = 0;
    loadingMessageTimer: any;
    showLoadingMessage: boolean = false;
    startTime: Moment;
    endTime: Moment;
    renderingProperties: Rendering;
    isPublic: boolean;
    showAppInsightsSection: boolean = true;
    isAppInsightsEnabled: boolean = false;
    appInsightQueryMetaDataList: AppInsightQueryMetadata[] = [];
    appInsightDataList: AppInsightData[] = [];
    diagnosticDataSet: DiagnosticData[] = [];
    loadingAppInsightsResource: boolean = true;
    loadingAppInsightsQueryData: boolean = true;
    supportDocumentContent: string = "";
    supportDocumentRendered: boolean = false;

    isDynamicAnalysis: boolean = false;
    searchTerm: string = "";
    searchId: string = null;
    showPreLoader: boolean = false;
    preLoadingErrorMessage: string = "Some error occurred while fetching diagnostics."
    showPreLoadingError: boolean = false;
    isSearchEmbedded: boolean = false;
    showSuccessfulChecks: boolean = true;

    constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
        private _diagnosticService: DiagnosticService, private _detectorControl: DetectorControlService,
        protected telemetryService: TelemetryService, public _appInsightsService: AppInsightsQueryService, private _supportTopicService: GenericSupportTopicService,
        @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;

        if (this.isPublic) {
            this._appInsightsService.CheckIfAppInsightsEnabled().subscribe(isAppinsightsEnabled => {
                this.isAppInsightsEnabled = isAppinsightsEnabled;
                this.loadingAppInsightsResource = false;
            });
        }
    }

    @Input()
    detectorParmName: string;

    @Input()
    withinDiagnoseAndSolve: boolean = false;

    ngOnInit() {
        this._detectorControl.update.subscribe(isValidUpdate => {
            if (isValidUpdate) {
                this.refresh();
            }
        });

        this.startTime = this._detectorControl.startTime;
        this.endTime = this._detectorControl.endTime;
    }

    toggleSuccessful(){
        this.showSuccessfulChecks = !this.showSuccessfulChecks;
    }

    public getMetaDataMarkdown(metaData: AppInsightQueryMetadata) {
        let str = "<pre>" + metaData.query + "</pre>";
        return str;
    }

    getApplicationInsightsData(response: DetectorResponse) {
        this.appInsightQueryMetaDataList = [];
        this.appInsightDataList = [];

        let appInsightDiagnosticData = response.dataset.filter(data => (<Rendering>data.renderingProperties).type === RenderingType.ApplicationInsightsView);

        appInsightDiagnosticData.forEach((diagnosticData: DiagnosticData) => {
            diagnosticData.table.rows.map(row => {
                this.appInsightQueryMetaDataList.push(<AppInsightQueryMetadata>{
                    title: row[0],
                    description: row[1],
                    query: row[2],
                    poralBladeInfo: row[3],
                    renderingProperties: row[4]
                });
            });
        });

        if (this.isPublic && this.appInsightQueryMetaDataList !== []) {
            this._appInsightsService.loadAppInsightsResourceObservable.subscribe(loadStatus => {
                if (loadStatus === true) {
                    this.loadingAppInsightsResource = false;
                    this.appInsightQueryMetaDataList.forEach(appInsightData => {
                        this._appInsightsService.ExecuteQuerywithPostMethod(appInsightData.query).subscribe(data => {
                            if (data && data["Tables"]) {
                                let rows = data["Tables"][0]["Rows"];
                                let columns = data["Tables"][0]["Columns"];
                                let dataColumns: DataTableResponseColumn[] = [];
                                columns.forEach(column => {
                                    dataColumns.push(<DataTableResponseColumn>{
                                        columnName: column.ColumnName,
                                        dataType: column.DataType,
                                        columnType: column.ColumnType,
                                    })
                                });

                                this.appInsightDataList.push(<AppInsightData>{
                                    title: appInsightData.title,
                                    description: appInsightData.description,
                                    renderingProperties: appInsightData.renderingProperties,
                                    table: rows,
                                    poralBladeInfo: appInsightData.poralBladeInfo,
                                    diagnosticData: <DiagnosticData>{
                                        table: <DataTableResponseObject>{
                                            columns: dataColumns,
                                            rows: rows,
                                        },
                                        renderingProperties: appInsightData.renderingProperties,
                                    }
                                });
                            }

                            this.loadingAppInsightsQueryData = false;
                        });
                    });
                }
            });
        }
    }

    populateSupportTopicDocument() {
        if (!this.supportDocumentRendered) {
            this._supportTopicService.getSelfHelpContentDocument().subscribe(res => {
                if (res && res.json() && res.json().length > 0) {
                    var htmlContent = res.json()[0]["htmlContent"];
                    // Custom javascript code to remove top header from support document html string
                    var tmp = document.createElement("DIV");
                    tmp.innerHTML = htmlContent;
                    var h2s = tmp.getElementsByTagName("h2");
                    if (h2s && h2s.length > 0) {
                        h2s[0].remove();
                    }

                    // Set the innter html for support document display
                    this.supportDocumentContent = tmp.innerHTML;
                    this.supportDocumentRendered = true;
                }
            });
        }
    }

    checkSearchEmbedded(response: DetectorResponse) {
        response.dataset.forEach((ds: DiagnosticData) => {
            if (ds.renderingProperties.type === RenderingType.SearchComponent) {
                this.isSearchEmbedded = true;
                this.showSuccessfulChecks = false;
            }
        });
    }

    refresh() {
        this._activatedRoute.paramMap.subscribe(params => {
            this.analysisId = params.get('analysisId');
            this.detectorId = params.get(this.detectorParmName) === null ? "" : params.get(this.detectorParmName);
            this.resetGlobals();
            this.populateSupportTopicDocument();

            if (this.analysisId === "searchResultsAnalysis") {
                this._activatedRoute.queryParamMap.subscribe(qParams => {
                    this.resetGlobals();
                    this.searchTerm = qParams.get('searchTerm') === null ? "" : qParams.get('searchTerm');
                    this.showAppInsightsSection = false;
                    if (this.searchTerm && this.searchTerm.length > 1) {
                        this.isDynamicAnalysis = true;
                        this.showSuccessfulChecks = false;
                        this.searchId = uuid();
                        let searchTask = this._diagnosticService.getDetectorsSearch(this.searchTerm).pipe(map((res) => res), catchError(e => of([])));
                        let detectorsTask = this._diagnosticService.getDetectors().pipe(map((res) => res), catchError(e => of([])));
                        this.showPreLoader = true;
                        observableForkJoin([searchTask, detectorsTask]).subscribe(results => {
                            this.showPreLoader = false;
                            this.showPreLoadingError = false;
                            var searchResults: DetectorMetaData[] = results[0];
                            this.logEvent(TelemetryEventNames.SearchQueryResults, { searchId: this.searchId, query: this.searchTerm, results: JSON.stringify(searchResults.map((det: DetectorMetaData) => new Object({ id: det.id, score: det.score }))), ts: Math.floor((new Date()).getTime() / 1000).toString() });
                            var detectorList = results[1];
                            if (detectorList) {
                                searchResults.forEach(result => {
                                    if (result.type === DetectorType.Detector) {
                                        this.insertInDetectorArray({ name: result.name, id: result.id, score: result.score });
                                    }
                                    else if (result.type === DetectorType.Analysis) {
                                        var childList = this.getChildrenOfAnalysis(result.id, detectorList);
                                        if (childList && childList.length > 0) {
                                            childList.forEach((child: DetectorMetaData) => {
                                                this.insertInDetectorArray({ name: child.name, id: child.id, score: result.score });
                                            });
                                        }
                                        else {
                                            this.insertInDetectorArray({ name: result.name, id: result.id, score: result.score });
                                        }
                                    }
                                });
                                this.startDetectorRendering(detectorList);
                            }
                        },
                            (err) => {
                                this.showPreLoader = false;
                                this.showPreLoadingError = true;
                            });
                    }
                });
            }
            else {
                // Add application insights analysis data
                this._diagnosticService.getDetector(this.analysisId, this._detectorControl.startTimeString, this._detectorControl.endTimeString)
                    .subscribe((response: DetectorResponse) => {
                        this.checkSearchEmbedded(response);
                        this.getApplicationInsightsData(response);
                    });

                this._diagnosticService.getDetectors().subscribe(detectorList => {
                    if (detectorList) {

                        if (this.detectorId !== "") {
                            let currentDetector = detectorList.find(detector => detector.id == this.detectorId)
                            this.detectorName = currentDetector.name;
                            return;
                        } else {
                            this.detectorEventProperties = {
                                'StartTime': String(this._detectorControl.startTime),
                                'EndTime': String(this._detectorControl.endTime),
                                'DetectorId': this.analysisId,
                                'ParentDetectorId': "",
                                'Url': window.location.href
                            };
                        }

                        detectorList.forEach(element => {

                            if (element.analysisTypes != null && element.analysisTypes.length > 0) {
                                element.analysisTypes.forEach(analysis => {
                                    if (analysis === this.analysisId) {
                                        this.detectors.push({ name: element.name, id: element.id });
                                        this.loadingMessages.push("Checking " + element.name);
                                    }
                                });
                            }
                        });

                        this.startDetectorRendering(detectorList);
                    }
                });
            }
        });
    }

    startDetectorRendering(detectorList) {
        this.detectorMetaData = detectorList.filter(detector => this.detectors.findIndex(d => d.id === detector.id) >= 0);
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
                            let issueDetectedViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description };
                            this.issueDetectedViewModels.push(issueDetectedViewModel);
                            this.issueDetectedViewModels = this.issueDetectedViewModels.sort((n1, n2) => n1.model.status - n2.model.status);
                        } else {
                            let insight = this.getDetectorInsight(this.detectorViewModels[index]);
                            let successViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description };
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
            if (this.searchId && this.searchId.length > 0) {
                this.childDetectorsEventProperties['SearchId'] = this.searchId;
            }
            this.logEvent(TelemetryEventNames.ChildDetectorsSummary, this.childDetectorsEventProperties);
        });
    }

    getChildrenOfAnalysis(analysisId, detectorList) {
        return detectorList.filter(element => (element.analysisTypes != null && element.analysisTypes.length > 0 && element.analysisTypes.findIndex(x => x == analysisId) >= 0)).map(element => { return { name: element.name, id: element.id }; });
    }

    insertInDetectorArray(detectorItem) {
        if (this.detectors.findIndex(x => x.id === detectorItem.id) < 0) {
            this.detectors.push(detectorItem);
            this.loadingMessages.push("Checking " + detectorItem.name);
        }
    }
    getPendingDetectorCount(): number {
        let pendingCount = 0;
        this.detectorViewModels.forEach((metaData, index) => {
            if (this.detectorViewModels[index].loadingStatus == LoadingStatus.Loading) {
                ++pendingCount;
            }
        });
        return pendingCount;
    }

    resetGlobals() {
        this.detectors = [];
        this.detectorViewModels = [];
        this.issueDetectedViewModels = [];
        this.loadingChildDetectors = false;
        this.allSolutions = [];
        this.loadingMessages = [];
        this.successfulViewModels = [];

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

    ngOnChanges() {
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
            request: this._diagnosticService.getDetector(detector.id, this._detectorControl.startTimeString, this._detectorControl.endTimeString)
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

                // Log children detectors click
                this.logEvent(TelemetryEventNames.ChildDetectorClicked, clickDetectorEventProperties);

                if (this.analysisId === "searchResultsAnalysis" && this.searchTerm && this.searchTerm.length > 0) {
                    this.logEvent(TelemetryEventNames.SearchResultClicked, { searchId: this.searchId, detectorId: detectorId, rank: 0, title: clickDetectorEventProperties.ChildDetectorName, status: clickDetectorEventProperties.Status, ts: Math.floor((new Date()).getTime() / 1000).toString() });
                    this._router.navigate([`../../../analysis/${this.analysisId}/search/detectors/${detectorId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true, queryParams: { searchTerm: this.searchTerm } });
                }
                else {
                    this._router.navigate([`../../analysis/${this.analysisId}/detectors/${detectorId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true });
                }
            }
        }

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
