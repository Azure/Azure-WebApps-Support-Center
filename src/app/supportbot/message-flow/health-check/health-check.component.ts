import { Component, Injector, Output, EventEmitter, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { Cache } from '../../../shared/models/icache';
import { IDetectorResponse } from '../../../shared/models/detectorresponse';
import { IAppAnalysisResponse } from '../../../shared/models/appanalysisresponse';
import { GraphHelper } from '../../../shared/utilities/graphHelper';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as _ from 'underscore';
import { OperatingSystem, Site, SiteExtensions } from '../../../shared/models/site';
import { BehaviorSubject } from 'rxjs/Rx';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { BotLoggingService } from '../../../shared/services/logging/bot.logging.service';
import { SiteService } from '../../../shared/services/site.service';
declare let d3: any;

@Component({
    templateUrl: 'health-check.component.html',
    styleUrls: ['health-check.component.css'],
})
export class HealthCheckComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    showLoadingMessage: boolean;
    chartOptions: any;
    chartData: any;
    healthCheckpointsSubject: BehaviorSubject<any[]> = new BehaviorSubject(null);
    healthCheckpoints: any[];
    selectedCategoryIndex: number;

    currentSite: Site;

    private _requestsColors: string[] = ["rgb(0, 188, 242)", "rgb(127, 186, 0)", "rgb(155, 79, 150)", "rgb(255, 140, 0)", "rgb(232, 17, 35)"];
    private _analysisData: Cache<IAppAnalysisResponse>;

    constructor(private _route: ActivatedRoute, private _analysisService: AppAnalysisService, private _logger: BotLoggingService, private _siteService: SiteService,
            private _router: Router) {
        this.showLoadingMessage = true;
        this._analysisData = {};

        this._logger.LogHealthCheckInvoked();

        this._siteService.currentSite.subscribe(site => {
            let checkpoints: any[] = [];

            checkpoints.push({
                category: 'availability',
                detector: 'runtimeavailability',
                title: 'Requests and Errors',
                graphOptions: (() => {
                    var options = GraphHelper.getDefaultChartOptions('lineChart', this._requestsColors, 300);
                    options.chart.yAxis.tickFormat = d3.format('d');
                    options.chart.yAxis.axisLabel = 'Request Count';
                    options.chart.forceY = [0, 10];
                    return options;
                })(),
                graphData: [],
                href: 'availability/analysis',
                healthStatus: undefined,
                healthStatusMessage: undefined
            });

            checkpoints.push({
                category: 'availability',
                detector: 'sitelatency',
                title: 'App Performance',
                graphOptions: (() => {
                    var options = GraphHelper.getDefaultChartOptions('lineChart', this._requestsColors, 300);
                    options.chart.yAxis.tickFormat = d3.format('d');
                    options.chart.yAxis.axisLabel = 'Response Time (ms)';
                    options.chart.forceY = [0, 10];

                    return options;
                })(),
                graphData: [],
                href: 'performance/analysis',
                healthStatus: undefined,
                healthStatusMessage: undefined
            });

            if (SiteExtensions.operatingSystem(site) === OperatingSystem.windows) {
                checkpoints.push({
                    category: 'availability',
                    detector: 'sitecpuanalysis',
                    title: 'CPU Usage',
                    graphOptions: (() => {
                        var options = GraphHelper.getDefaultChartOptions('lineChart', this._requestsColors, 300);
                        options.chart.yAxis.tickFormat = d3.format('.1f');
                        options.chart.yAxis.axisLabel = 'CPU Usage (%)';
                        options.chart.forceY = [0, 10];

                        return options;
                    })(),
                    graphData: [],
                    href: 'availability/detectors/sitecpuanalysis',
                    healthStatus: undefined,
                    healthStatusMessage: undefined
                });

                checkpoints.push({
                    category: 'availability',
                    detector: 'sitememoryanalysis',
                    title: 'Memory Usage',
                    graphOptions: (() => {
                        var options = GraphHelper.getDefaultChartOptions('lineChart', this._requestsColors, 300);
                        options.chart.yAxis.tickFormat = d3.format('.1f');
                        options.chart.yAxis.axisLabel = 'Memory Usage (%)';
                        options.chart.forceY = [0, 10];

                        return options;
                    })(),
                    graphData: [],
                    href: 'availability/memoryanalysis',
                    healthStatus: undefined,
                    healthStatusMessage: undefined
                });
            }
            this.healthCheckpoints = checkpoints;
            this.healthCheckpointsSubject.next(checkpoints);
        });
    }

    ngOnInit(): void {

        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

        if (!this.siteName) {
            this.siteName = this._route.snapshot.params['resourcename'];
        }

        this._loadData();
    }

    ngAfterViewInit(): void {
        this.onViewUpdate.emit();
    }

    setCategory(index: number) {
        this.selectedCategoryIndex = index;
        this.chartOptions = this.healthCheckpoints[index].graphOptions;
        this.chartData = this.healthCheckpoints[index].graphData;
    }

    logFullReportClick(title: string) {
        this._logger.LogClickEvent('Full Report', `${title} : Health Check Report Category`, 'Support Home');
    }

    onFullReportClick(href: string, title: string) {
        let slot = this.slotName && this.slotName != '' ? `/slots/${this.slotName}`: '';
        this._router.navigateByUrl(`legacy/subscriptions/${this.subscriptionId}/resourcegroups/${this.resourceGroup}/providers/microsoft.web/sites/${this.siteName}${slot}/diagnostics/${href}`)
        this.logFullReportClick(title);
    }

    private _loadData() {
        this.healthCheckpointsSubject.subscribe(checkpoints => {
            if (checkpoints) {
                var detectorsObservable = Observable.forkJoin(this._getDetectorTasks(checkpoints));
                var analysisObservable = Observable.forkJoin(this._getAnalysisTasks());
                var mergedObservable = Observable.forkJoin<IDetectorResponse[], IAppAnalysisResponse[]>(detectorsObservable, analysisObservable);

                mergedObservable.subscribe(data => {
                    this._parseDataIntoCategories(data);
                }, onError => { },
                    () => {

                        this.setCategory(0);
                        this.showLoadingMessage = false;

                        setTimeout(() => {
                            this.onViewUpdate.emit();
                        }, 100);

                        setTimeout(() => {
                            this.onComplete.emit({ status: true });
                        }, 2000);
                    });
            }
        })

    }

    private _getDetectorTasks(checkpoints: any[]): Observable<IDetectorResponse>[] {

        var result: Observable<IDetectorResponse>[] = [];

        checkpoints.forEach((item) => {
            result.push(this._analysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, item.category, item.detector));
        });

        return result;
    }

    private _getAnalysisTasks(): Observable<IAppAnalysisResponse>[] {

        var analysisList = ["appanalysis", "perfanalysis"]
        var result: Observable<IAppAnalysisResponse>[] = [];
        analysisList.forEach((item) => {
            result.push(this._analysisService.getAnalysisResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', item)
                .do((data: IAppAnalysisResponse) => this._analysisData[item] = data));
        });

        return result;
    }

    private _parseDataIntoCategories(data: any) {

        let detectorResponses = data[0];
        let analysisResponses = data[1];

        var healthCheckResultForLogging: string[] = [];

        detectorResponses.forEach((item: IDetectorResponse) => {
            let name = item.detectorDefinition.name;
            let category = _.find(this.healthCheckpoints, (entry) => {
                return entry.detector.toLowerCase() === name.toLowerCase();
            });

            if (category) {
                switch (category.detector.toLowerCase()) {
                    case 'runtimeavailability':

                        let requestMetrics = item.metrics.filter(p => (p.name.toLowerCase().indexOf('availability') < 0));
                        category.graphData = GraphHelper.parseMetricsToChartData(requestMetrics, 0, true);
                        var currentAppHealth = undefined;
                        if (item.data && item.data.length > 0) {
                            currentAppHealth = item.data[0].find(p => p.name.toLocaleLowerCase() === "currentapphealth");
                        }

                        if (currentAppHealth && currentAppHealth.value.toLocaleLowerCase() === 'unhealthy') {
                            category.healthStatus = 'error';
                            category.healthStatusMessage = 'Your Web App is currently experiencing HTTP server errors. Please "View Full Report" to see more detailed observations and quick solutions.';
                        }
                        else {

                            if (item.abnormalTimePeriods && item.abnormalTimePeriods.length > 0) {
                                category.healthStatus = 'warning';
                                category.healthStatusMessage = 'Your Web App is currently running healthy. However, we have detected downtime in the last 24 hours during which your Web App was experiencing errors. Please "View Full Report" to see more detailed observations and troubleshooting advice.';
                            }
                            else {
                                category.healthStatus = 'success';
                                category.healthStatusMessage = 'Your Web App is currently running healthy. Check out "View Full Report" if you would like to check the availability of your Web App from the last 24 hours.';
                            }
                        }

                        healthCheckResultForLogging.push(`Availability-${this._getLevelIndicator(category.healthStatus)}`);

                        break;
                    case 'sitelatency':
                        category.graphData = GraphHelper.parseMetricsToChartData(item.metrics);
                        if (category.graphData && category.graphData.length > 0) {
                            category.graphData.forEach(element => {
                                if (element.key === '90th Percentile' || element.key === '95th Percentile') {
                                    element.disabled = true;
                                }
                            });
                        }

                        if (item.abnormalTimePeriods && item.abnormalTimePeriods.length > 0) {
                            category.healthStatus = 'warning';
                            category.healthStatusMessage = 'Your Web App has experienced performance issues in the last 24 hours. Please "View Full Report" to further analyze your Web App response time and view troubleshooting advice.';
                        }
                        else {
                            category.healthStatus = 'success';
                            category.healthStatusMessage = 'Your Web App currently has no performance issues. Check out "View Full Report" if you would like to check your Web App response time.';
                        }

                        healthCheckResultForLogging.push(`Performance-${this._getLevelIndicator(category.healthStatus)}`);

                        break;
                    case 'sitecpuanalysis':
                        let metrics = item.metrics.filter(p => (p.name.toLowerCase().indexOf('percent') > -1));
                        category.graphData = GraphHelper.parseMetricsToChartDataPerInstance(metrics);

                        var currentHealth = undefined;
                        if (item.data && item.data.length > 0) {
                            currentHealth = item.data[0].find(p => p.name.toLocaleLowerCase() === "currenthealth");
                        }

                        if (currentHealth && currentHealth.value.toLocaleLowerCase() === 'unhealthy') {
                            category.healthStatus = 'error';
                            category.healthStatusMessage = 'Your Web App is currently experiencing high CPU usage. Please "View Full Report" to further analyze your CPU usage per instance breakdown.';
                        }
                        else {
                            if (item.abnormalTimePeriods && item.abnormalTimePeriods.length > 0) {
                                category.healthStatus = 'warning';
                                category.healthStatusMessage = 'Your Web App has experienced high CPU usage in the last 24 hours. Please "View Full Report" to further analyze your CPU usage per instance breakdown.';
                            }
                            else {
                                category.healthStatus = 'success';
                                category.healthStatusMessage = 'Your Web App currently has normal CPU usage. Check out "View Full Report" if you would like to check the CPU usage per instance breakdown.';
                            }
                        }

                        healthCheckResultForLogging.push(`CPU Usage-${this._getLevelIndicator(category.healthStatus)}`);

                        break;
                    case 'sitememoryanalysis':
                        let memoryMetrics = item.metrics.filter(p => (p.name.toLowerCase().indexOf('percent') > -1));
                        category.graphData = GraphHelper.parseMetricsToChartDataPerInstance(memoryMetrics);

                        var currentHealth = undefined;
                        if (item.data && item.data.length > 0) {
                            currentHealth = item.data[0].find(p => p.name.toLocaleLowerCase() === "currenthealth");
                        }

                        if (currentHealth && currentHealth.value.toLocaleLowerCase() === 'unhealthy') {
                            category.healthStatus = 'error';
                            category.healthStatusMessage = 'Your Web App is currently experiencing high memory usage. Please "View Full Report" to further analyze your memory usage per instance breakdown.';
                        }
                        else {
                            if (item.abnormalTimePeriods && item.abnormalTimePeriods.length > 0) {
                                category.healthStatus = 'warning';
                                category.healthStatusMessage = 'Your Web App has experienced high memory usage in the last 24 hours. Please "View Full Report" to further analyze your memory usage per instance breakdown.';
                            }
                            else {
                                category.healthStatus = 'success';
                                category.healthStatusMessage = 'Your Web App currently has normal memory usage. Check out "View Full Report" if you would like to check the memory usage per instance breakdown.';
                            }
                        }

                        healthCheckResultForLogging.push(`Memory Usage-${this._getLevelIndicator(category.healthStatus)}`);

                        break;
                    default:
                        category.graphData = GraphHelper.parseMetricsToChartData(item.metrics);
                        break;
                }
            }
        });

        if (healthCheckResultForLogging && healthCheckResultForLogging.length > 0) {
            this._logger.LogHealthCheckResults(healthCheckResultForLogging);
        }
    }

    private _getLevelIndicator(level: string): string {

        switch (level.toLowerCase()) {
            case 'warning':
                return 'yellow';
            case 'error':
                return 'red';
            default:
                return 'green';
        }
    }
}
