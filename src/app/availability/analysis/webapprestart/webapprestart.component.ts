import { Component, OnInit, trigger, state, animate, transition, style } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IAppAnalysisResponse } from '../../../shared/models/appanalysisresponse';
import { IDetectorAbnormalTimePeriod, IMetricSet, IMetricSample } from '../../../shared/models/detectorresponse';
import { StartupInfo } from '../../../shared/models/portal';
import { INameValuePair } from '../../../shared/models/namevaluepair';
import { Cache } from '../../../shared/models/icache';
import { GraphHelper } from '../../../shared/utilities/graphHelper';
import { SupportBladeDefinitions, BladeOptions } from '../../../shared/models/portal';
import * as _ from 'underscore';
import { IMyDpOptions, IMyDate, IMyDateModel } from 'mydatepicker';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { AvailabilityLoggingService } from '../../../shared/services/logging/availability.logging.service';
import { AuthService } from '../../../startup/services/auth.service';
import { WindowService } from '../../../startup/services/window.service';
import { PortalActionService } from '../../../shared/services/portal-action.service';

declare let d3: any;

@Component({
    templateUrl: 'webapprestart.component.html',
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
export class WebAppRestartComponent implements OnInit {

    bladeOpenedFromSupportTicketFlow: boolean;
    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;
    analysisResult: IDetectorAbnormalTimePeriod[];
    metricsPerInstance: Cache<any>;
    allInstances: string[];
    selectedWorker: string;
    noReason: any;
    showToolsDropdown: boolean = false;

    loadingAnalysis: boolean;
    showLoadingMessage: boolean;
    loadingMessages: string[] = [
        "Searching Restart Events for Application : {siteName}",
        "Analyzing User initiated events",
        "Analyzing Platform events",
        "Compiling Results"
    ];
    currentLoadingMessage: string;
    loadingMessageIndex: number;
    loadingMessageTimer: any;

    chartOptions: any;
    private _seriesColors: string[] = ["#D4E157", "rgb(0, 188, 242)", "rgb(127, 186, 0)", "rgb(155, 79, 150)", "rgb(255, 140, 0)", "rgb(232, 17, 35)", "#4286f4", "#c741f4"];

    myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'yyyy-mm-dd',
        showTodayBtn: false,
        satHighlight: false,
        sunHighlight: false,
        showClearDateBtn: false,
        monthSelector: false,
        yearSelector: false,
        editableDateField: false,
    };

    dateModel: any;

    constructor(private _route: ActivatedRoute, private _analysisService: AppAnalysisService, private _logger: AvailabilityLoggingService, private _authService: AuthService, private _windowService: WindowService, private _portalActionService: PortalActionService) {
        this._logger.LogAnalysisInitialized('App Restart Analysis');
        this.loadingAnalysis = true;

        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

        this.startLoadingMessage();

        let currentDate: Date = GraphHelper.convertToUTCTime(new Date());
        let disableSince = GraphHelper.convertToUTCTime(new Date());
        let disableUntil = GraphHelper.convertToUTCTime(new Date());
        disableSince.setDate(disableSince.getDate() + 1);
        disableUntil.setDate(disableUntil.getDate() - 30);

        this.dateModel = {
            date: { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1, day: currentDate.getDate() },
            formatted: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`
        };
        this.myDatePickerOptions.disableSince = { year: disableSince.getFullYear(), month: disableSince.getMonth() + 1, day: disableSince.getDate() };
        this.myDatePickerOptions.disableUntil = { year: disableUntil.getFullYear(), month: disableUntil.getMonth() + 1, day: disableUntil.getDate() };

        this.chartOptions = GraphHelper.getDefaultChartOptions('multiBarChart', this._seriesColors);
        this.chartOptions.chart.useInteractiveGuideline = false;
        this.chartOptions.chart.yAxis.tickFormat = d3.format('d');
    }

    ngOnInit(): void {

        this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
            this.bladeOpenedFromSupportTicketFlow = startupInfo.source !== undefined && startupInfo.source.toLowerCase() === 'casesubmission';
        });

        this._loadData();
    }

    private _loadData(startDate: string = '', invalidateCache: boolean = false): void {

        this.analysisResult = [];
        this.metricsPerInstance = {};
        this.metricsPerInstance['Overall'] = [];
        this.allInstances = ['Overall'];
        this.selectedWorker = 'Overall';

        this.noReason = {
            message: 'The application did not experienced any restarts during this time.',
            type: 0
        };

        this.chartOptions.chart.callback = function (chart) {
            chart.dispatch.changeState({ disabled: { 0: true } });
        }

        let self = this;
        var allMetrics: IMetricSet[] = [];
        this.loadingAnalysis = true;

        this._analysisService.getAnalysisResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'apprestartanalysis', invalidateCache, startDate)
            .subscribe((response: IAppAnalysisResponse) => {

                self.loadingAnalysis = false;
                if(self.loadingMessageTimer){
                    clearInterval(self.loadingMessageTimer);                    
                }

                if (response.abnormalTimePeriods && response.abnormalTimePeriods.length > 0) {
                    self.analysisResult = response.abnormalTimePeriods[0].events;
                    self._logger.LogAppRestartAnalysisSummary(startDate === ''? 'Current' : startDate, self.analysisResult.length.toString());
                }
                else {
                    self._logger.LogAppRestartAnalysisSummary(startDate === ''? 'Current' : startDate, "0");
                    
                    self.chartOptions.chart.callback = function (chart) {
                        chart.dispatch.changeState({ disabled: { 0: false } })
                    };

                    let workerprocessrecycle = _.find(response.payload, function (item) {
                        return item.source === 'workerprocessrecycle';
                    });

                    if (workerprocessrecycle) {
                        if (workerprocessrecycle.metrics && workerprocessrecycle.metrics.length > 0 && workerprocessrecycle.metrics[0].values.length > 0) {
                            self.noReason.message = "The application did experienced restarts. However, at this point of time, we couldn't find any reasons for the application restart.";
                            self.noReason.type = 1;
                        }
                    }

                    self._logger.LogMessage(self.noReason.message);
                }

                response.payload.forEach(function (item) {
                    allMetrics = allMetrics.concat(item.metrics);
                });

                self._initializeMetricsPerInstance(allMetrics, response.startTime, response.endTime);

            });
    }

    private _initializeMetricsPerInstance(metrics: IMetricSet[], startTime: string, endTime: string): void {

        let self = this;

        metrics.forEach(function (item) {
            let groupByRoleInstances = _.groupBy(item.values, function (sample: IMetricSample) { return sample.roleInstance ? sample.roleInstance.replace('(', '[').replace(')', ']') : 'Overall' });

            Object.keys(groupByRoleInstances).forEach(function (item: any) {
                if (Object.keys(self.metricsPerInstance).indexOf(item) === -1) {
                    self.metricsPerInstance[item] = [];
                    self.allInstances.push(item);
                }
            });
        });

        metrics.forEach(function (item) {

            Object.keys(self.metricsPerInstance).forEach(function (instanceItem: any) {

                var graphSeries: any = {
                    key: item.name,
                    values: []
                };

                var metricSamples: IMetricSample[] = [];

                if (instanceItem === 'Overall') {
                    metricSamples = item.values.filter(function (metricSample: IMetricSample) {
                        return metricSample.isAggregated === true;
                    });
                }
                else {
                    metricSamples = item.values.filter(function (metricSample: IMetricSample) {
                        return metricSample.roleInstance && metricSample.roleInstance.replace('(', '[').replace(')', ']') === instanceItem;
                    });
                }

                graphSeries.values = self._fillValuesInGraphSeries(startTime, endTime, metricSamples);
                self.metricsPerInstance[instanceItem].push(graphSeries);
            });
        });
    }

    private _fillValuesInGraphSeries(startTimeStr: string, endTimeStr: string, metricSamples: IMetricSample[]): any {

        var startTime = new Date(startTimeStr);
        var endTime = new Date(endTimeStr);
        var coeff = 1000 * 60 * 5;
        var roundedStartTime = new Date(Math.round(startTime.getTime() / coeff) * coeff);
        var roundedEndTime = new Date(Math.round(endTime.getTime() / coeff) * coeff);
        var values = [];
        for (var d = new Date(roundedStartTime.getTime()); d < roundedEndTime; d.setTime(d.getTime() + coeff)) {

            let xDate = new Date(d.getTime());
            let yValue = 0;

            let element = _.find(metricSamples, function (item: IMetricSample) {
                return xDate.getTime() === (new Date(item.timestamp)).getTime();
            });

            if (element) {
                yValue = element.total;
            }

            values.push({
                x: GraphHelper.convertToUTCTime(xDate),
                y: yValue
            });
        }

        return values;
    }

    private _openBlogUrl(link: string, name: string): void {

        this._logger.LogClickEvent(name, 'Web App Restart Analysis');
        this._windowService.window.open(link, '_blank');
    }

    getHelpfulTipName(evidence: INameValuePair[]): string {
        let displayName = _.find(evidence, function (item) { return item.name === 'displayedName' });
        if (displayName) {
            return displayName.value;
        }

        return '';
    }

    OpenHelpulTip(evidence: INameValuePair[]): void {
        let feature = _.find(evidence, function (item) { return item.name === 'feature' });
        if (!feature) {
            return;
        }

        switch (feature.value.toLowerCase()) {
            case 'autoheal':
                this._openBlogUrl('https://goo.gl/XZ7F2a', feature.value);
                break;

            case 'crashdiagnoser':
                this._openBlogUrl('https://goo.gl/vogvVR', feature.value);
                break;

            case 'appanalysis':
            case 'perfanalysis':
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.MetricPerInstance);
                break;

            case 'memoryanalysis':
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.AppServicePlanMetrics);
                break;

            case 'auditlogs':
                this._openBlogUrl('https://goo.gl/8Z2vxT', feature.value);
                break;

            case 'localcache':
                this._openBlogUrl('https://goo.gl/zc6Wmi', feature.value);
                break;

            case 'trafficmanager':
                this._openBlogUrl('https://goo.gl/VwUoTp', feature.value);
                break;
        }
    }

    startLoadingMessage(): void {
        let self = this;
        this.loadingMessageIndex = 0;
        this.currentLoadingMessage = this.loadingMessages[this.loadingMessageIndex].replace("{siteName}", this.siteName);
        this.showLoadingMessage = true;

        setTimeout(() => {
            self.showLoadingMessage = false;
        }, 3000)
        this.loadingMessageTimer = setInterval(() => {
            self.loadingMessageIndex++;
            self.currentLoadingMessage = this.loadingMessages[this.loadingMessageIndex];

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

    RefreshData(event: IMyDateModel): void {

        this._logger.LogClickEvent('Date Filter', 'Web App Restart Analysis');
        this._logger.LogMessage(`New Date Selected :${event.formatted}`);

        let currentDate: Date = GraphHelper.convertToUTCTime(new Date());
        this.startLoadingMessage();
        this.showToolsDropdown = false;

        var dateFilter = event.formatted;

        if (`${event.date.year}-${event.date.month}-${event.date.day}` === `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`) {
            dateFilter = '';
        }

        this._loadData(dateFilter, true);
    }
}