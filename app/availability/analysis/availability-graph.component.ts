import { Component, OnInit, OnChanges, Input, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IMetricSet, IDetectorResponse } from '../../shared/models/detectorresponse';
import { GraphHelper } from '../../shared/utilities/graphHelper';
import { IAppAnalysisResponse, IAbnormalTimePeriod } from '../../shared/models/appanalysisresponse';
import { PortalActionService, ServerFarmDataService, AvailabilityLoggingService, AuthService, AppAnalysisService } from '../../shared/services';

declare let d3: any;

@Component({
    selector: 'availability-graph',
    templateUrl: 'availability-graph.component.html',
    styleUrls: ["availability-graph.component.css"]
})
export class AvailabilityGraphComponent implements OnInit, OnChanges {

    runtimeAvailabilityResponse: IDetectorResponse;
    siteLatencyResponse: IDetectorResponse;

    runtimeAvailabilityMetrics: IMetricSet[];
    siteLatencyMetrics: IMetricSet[];

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    metSLA: boolean;

    @Input() displayGraph: boolean;
    @Output() displayGraphChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    @Input() topLevelGraphRefreshIndex: number;

    public availabilityGraphData: any;
    public requestsGraphData: any;
    public latencyGraphData: any;
    public availabilityGraphOptions: any;
    public requestsGraphOptions: any;
    public latencyGraphOptions: any;

    public showPerformanceFirst: boolean;

    public dataOption: number = 0;

    private _requestsColors: [string] = ["rgb(0, 188, 242)", "rgb(127, 186, 0)", "rgb(155, 79, 150)", "rgb(255, 140, 0)", "rgb(232, 17, 35)"];
    private _availabilityColors: [string] = ["rgb(127, 186, 0)", "rgb(0, 188, 242)"];

    constructor(private _activatedRoute: ActivatedRoute, private _appAnalysisService: AppAnalysisService, private _serverFarmService: ServerFarmDataService, private _logger: AvailabilityLoggingService, private _authService: AuthService) {
        this.setupGraphOptions();

        // TODO: check if this works for slots
        if (this._activatedRoute.snapshot.parent.url.length > 7 && this._activatedRoute.snapshot.parent.url[7].toString() === 'performance') {
            this.showPerformanceFirst = true;
            this.dataOption = 2;
        }
        else if (this._activatedRoute.snapshot.url.length > 7 && this._activatedRoute.snapshot.url[7].toString() === 'performance') {
            this.showPerformanceFirst = true;
            this.dataOption = 2;
        }
    }

    ngOnInit(): void {
        this.subscriptionId = this._activatedRoute.snapshot.params['subscriptionid'];
        this.resourceGroup = this._activatedRoute.snapshot.params['resourcegroup'];
        this.siteName = this._activatedRoute.snapshot.params['sitename'];
        this.slotName = this._activatedRoute.snapshot.params['slot'] ? this._activatedRoute.snapshot.params['slot'] : '';

        this._loadData();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['topLevelGraphRefreshIndex'] && !changes['topLevelGraphRefreshIndex'].isFirstChange()) {
            this.requestsGraphData = null;
            this.availabilityGraphData = null;
            this.latencyGraphData = null;
            this.runtimeAvailabilityResponse = null;
            this.runtimeAvailabilityMetrics = null;
            this.siteLatencyResponse = null;
            this.siteLatencyMetrics = null;

            this._loadData();
        }
    }

    private _loadData(): void {
        this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'runtimeavailability').subscribe(data => {
            this.runtimeAvailabilityResponse = data;
            this.runtimeAvailabilityMetrics = this.runtimeAvailabilityResponse.metrics;
            if (this.runtimeAvailabilityResponse && this.runtimeAvailabilityResponse.data && this.runtimeAvailabilityResponse.data.length > 0) {

                let metSLAItem = this.runtimeAvailabilityResponse.data[0].find(p => p.name.toLowerCase() === "metsla");
                if (metSLAItem && metSLAItem.value.toLowerCase() === 'true') {
                    this.metSLA = true;
                    this.availabilityGraphOptions.chart.forceY = [0, 100];
                }
                else {
                    this.metSLA = false;
                }

                let availabilityMetrics = this.runtimeAvailabilityMetrics.filter(p => (p.name.toLowerCase().indexOf('availability') > -1));
                let requestMetrics = this.runtimeAvailabilityMetrics.filter(p => (p.name.toLowerCase().indexOf('availability') < 0));

                if (availabilityMetrics) {
                    this.availabilityGraphData = GraphHelper.parseMetricsToChartData(availabilityMetrics, 100);
                }

                if (requestMetrics) {
                    this.requestsGraphData = GraphHelper.parseMetricsToChartData(requestMetrics, 0, true);
                }
            }
        });

        this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'sitelatency').subscribe(data => {
            this.siteLatencyResponse = data;
            this.siteLatencyMetrics = this.siteLatencyResponse.metrics;

            this.latencyGraphData = GraphHelper.parseMetricsToChartData(this.siteLatencyMetrics, 0, false);
            if (this.latencyGraphData && this.latencyGraphData.length > 0) {
                this.latencyGraphData.forEach(element => {
                    if (element.key === '90th Percentile' || element.key === '95th Percentile') {
                        element.disabled = true;
                    }
                });
            }

        });

        if (this.showPerformanceFirst) {
            this.dataOption = 2;
        }
    }

    onDisplayChange(event: any) {
        this.displayGraphChange.emit(this.displayGraph);
    }

    selectGraphButton(option: number) {
        //TODO: log
        this.dataOption = option;
        this.displayGraph = true;
    }

    setupGraphOptions(): void {
        this.availabilityGraphOptions = GraphHelper.getDefaultChartOptions();
        this.availabilityGraphOptions.chart.color = this._availabilityColors;
        this.availabilityGraphOptions.chart.yAxis.tickFormat = d3.format('.2f');
        this.availabilityGraphOptions.chart.yAxis.axisLabel = 'Percent'
        this.availabilityGraphOptions.chart.forceY = undefined;


        this.requestsGraphOptions = GraphHelper.getDefaultChartOptions();
        this.requestsGraphOptions.chart.color = this._requestsColors;
        this.requestsGraphOptions.chart.yAxis.tickFormat = d3.format('d');
        this.requestsGraphOptions.chart.yAxis.axisLabel = 'Request Count';
        this.requestsGraphOptions.chart.forceY = [0, 10];

        this.latencyGraphOptions = GraphHelper.getDefaultChartOptions();
        this.latencyGraphOptions.chart.color = this._requestsColors;
        this.latencyGraphOptions.chart.yAxis.tickFormat = d3.format('d');
        this.latencyGraphOptions.chart.yAxis.axisLabel = 'Response Time (ms)';
        this.latencyGraphOptions.chart.forceY = [0, 10];
    }
}