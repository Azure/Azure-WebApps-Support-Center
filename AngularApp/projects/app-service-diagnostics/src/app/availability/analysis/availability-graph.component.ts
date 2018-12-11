import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IMetricSet, IDetectorResponse } from '../../shared/models/detectorresponse';
import { GraphHelper } from '../../shared/utilities/graphHelper';
import { AppAnalysisService } from '../../shared/services/appanalysis.service';
import { DetectorControlService } from 'diagnostic-data';
import { Subscription } from 'rxjs';

declare let d3: any;

@Component({
    selector: 'availability-graph',
    templateUrl: 'availability-graph.component.html',
    styleUrls: ["availability-graph.component.scss"]
})
export class AvailabilityGraphComponent implements OnInit, OnDestroy {

    runtimeAvailabilitySubscription: Subscription;
    siteLatencySubscription: Subscription;

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
    @Input() displayTimeLine: boolean = false;
    @Output() displayGraphChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    @Input() showPerformanceFirst: boolean = false;

    public availabilityGraphData: any;
    public requestsGraphData: any;
    public latencyGraphData: any;
    public availabilityGraphOptions: any;
    public requestsGraphOptions: any;
    public latencyGraphOptions: any;

    public dataOption: number = 0;

    refreshSubscription: Subscription;

    private _requestsColors: string[] = ["rgb(0, 188, 242)", "rgb(127, 186, 0)", "rgb(155, 79, 150)", "rgb(255, 140, 0)", "rgb(232, 17, 35)"];
    private _availabilityColors: string[] = ["rgb(127, 186, 0)", "rgb(0, 188, 242)"];

    constructor(private _activatedRoute: ActivatedRoute, private _appAnalysisService: AppAnalysisService, private _detectorControlService: DetectorControlService) {
        this.setupGraphOptions();
    }

    ngOnInit(): void {

        if(this.showPerformanceFirst) {
            this.dataOption = 2;
        }

        this.subscriptionId = this._activatedRoute.snapshot.params['subscriptionid'];
        this.resourceGroup = this._activatedRoute.snapshot.params['resourcegroup'];
        this.siteName = this._activatedRoute.snapshot.params['resourcename']
        this.slotName = this._activatedRoute.snapshot.params['slot'] ? this._activatedRoute.snapshot.params['slot'] : '';

        this.refreshSubscription = this._detectorControlService.update.subscribe(isValidUpdate => {
            if (isValidUpdate) {
                this.refresh();
            }
        });
    }

    ngOnDestroy() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
        }
        
        this._clearRequestSubscriptions();
    }

    private refresh() {
        this.requestsGraphData = null;
        this.availabilityGraphData = null;
        this.latencyGraphData = null;
        this.runtimeAvailabilityResponse = null;
        this.runtimeAvailabilityMetrics = null;
        this.siteLatencyResponse = null;
        this.siteLatencyMetrics = null;
        this._clearRequestSubscriptions();

        this._loadData(true);
    }

    private _loadData(invalidateCache: boolean = false): void {
        this.runtimeAvailabilitySubscription = this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'runtimeavailability', invalidateCache).subscribe(data => {
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

        this.siteLatencySubscription = this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'sitelatency', invalidateCache, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString).subscribe(data => {
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

    private _clearRequestSubscriptions() {
        if (this.runtimeAvailabilitySubscription) {
            this.runtimeAvailabilitySubscription.unsubscribe();
        }
        
        if (this.siteLatencySubscription) {
            this.siteLatencySubscription.unsubscribe();
        }
    }
}