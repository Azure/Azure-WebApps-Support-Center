import { Component, Output, EventEmitter, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { Cache } from '../../../shared/models/icache';
import { IDetectorResponse } from '../../../shared/models/detectorresponse';
import { IAppAnalysisResponse } from '../../../shared/models/appanalysisresponse';
import { GraphHelper } from '../../../shared/utilities/graphHelper';
import { Observable ,  BehaviorSubject } from 'rxjs';
import { OperatingSystem, Site, SiteExtensions } from '../../../shared/models/site';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { BotLoggingService } from '../../../shared/services/logging/bot.logging.service';
import { SiteService } from '../../../shared/services/site.service';
import { HealthStatus, LoadingStatus } from 'diagnostic-data';
declare let d3: any;

@Component({
    templateUrl: 'health-check.component.html',
    styleUrls: ['health-check.component.scss'],
})
export class HealthCheckComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

    HealthStatus = HealthStatus;
    LoadingStatus = LoadingStatus;

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    showLoadingMessage: boolean;
    chartOptions: any;
    chartData: any = [];
    healthCheckpointsSubject: BehaviorSubject<any[]> = new BehaviorSubject(null);
    healthCheckpoints: any[];
    selectedCategoryIndex: number = 0;

    healthCheckResultForLogging: string[] = [];

    currentSite: Site;

    private _requestsColors: string[] = ['rgb(0, 188, 242)', 'rgb(127, 186, 0)', 'rgb(155, 79, 150)', 'rgb(255, 140, 0)', 'rgb(232, 17, 35)'];
    private _analysisData: Cache<IAppAnalysisResponse>;

    constructor(private _route: ActivatedRoute, private _analysisService: AppAnalysisService, private _logger: BotLoggingService, private _siteService: SiteService,
        private _router: Router) {
        this.showLoadingMessage = true;
        this._analysisData = {};

        this._logger.LogHealthCheckInvoked();

        this._siteService.currentSite.subscribe(site => {
            const checkpoints: any[] = [];

            checkpoints.push({
                category: 'availability',
                detector: 'runtimeavailability',
                title: 'Requests and Errors',
                graphOptions: (() => {
                    const options = GraphHelper.getDefaultChartOptions('lineChart', this._requestsColors, 300);
                    options.chart.yAxis.tickFormat = d3.format('d');
                    options.chart.yAxis.axisLabel = 'Request Count';
                    options.chart.forceY = [0, 10];
                    return options;
                })(),
                graphData: [],
                href: 'availability/analysis',
                healthStatus: HealthStatus.None,
                healthStatusMessage: undefined,
                loadingStatus: LoadingStatus.Loading
            });

            checkpoints.push({
                category: 'availability',
                detector: 'sitelatency',
                title: 'App Performance',
                graphOptions: (() => {
                    const options = GraphHelper.getDefaultChartOptions('lineChart', this._requestsColors, 300);
                    options.chart.yAxis.tickFormat = d3.format('d');
                    options.chart.yAxis.axisLabel = 'Response Time (ms)';
                    options.chart.forceY = [0, 10];

                    return options;
                })(),
                graphData: [],
                href: 'performance/analysis',
                healthStatus: HealthStatus.None,
                healthStatusMessage: undefined,
                loadingStatus: LoadingStatus.Loading
            });

            if (SiteExtensions.operatingSystem(site) === OperatingSystem.windows) {
                checkpoints.push({
                    category: 'availability',
                    detector: 'sitecpuanalysis',
                    title: 'CPU Usage',
                    graphOptions: (() => {
                        const options = GraphHelper.getDefaultChartOptions('lineChart', this._requestsColors, 300);
                        options.chart.yAxis.tickFormat = d3.format('.1f');
                        options.chart.yAxis.axisLabel = 'CPU Usage (%)';
                        options.chart.forceY = [0, 10];

                        return options;
                    })(),
                    graphData: [],
                    href: 'availability/detectors/sitecpuanalysis',
                    healthStatus: HealthStatus.None,
                    healthStatusMessage: undefined,
                    loadingStatus: LoadingStatus.Loading
                });

                checkpoints.push({
                    category: 'availability',
                    detector: 'sitememoryanalysis',
                    title: 'Memory Usage',
                    graphOptions: (() => {
                        const options = GraphHelper.getDefaultChartOptions('lineChart', this._requestsColors, 300);
                        options.chart.yAxis.tickFormat = d3.format('.1f');
                        options.chart.yAxis.axisLabel = 'Memory Usage (%)';
                        options.chart.forceY = [0, 10];

                        return options;
                    })(),
                    graphData: [],
                    href: 'availability/memoryanalysis',
                    healthStatus: HealthStatus.None,
                    healthStatusMessage: undefined,
                    loadingStatus: LoadingStatus.Loading
                });
            }
            this.healthCheckpoints = checkpoints;
            this.healthCheckpointsSubject.next(checkpoints);
        });
    }

    ngOnInit(): void {

        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['resourcename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

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
        const slot = this.slotName && this.slotName != '' ? `/slots/${this.slotName}` : '';
        this._router.navigateByUrl(`resource/subscriptions/${this.subscriptionId}/resourcegroups/${this.resourceGroup}/providers/microsoft.web/sites/${this.siteName}${slot}/legacy/diagnostics/${href}`);
        this.logFullReportClick(title);
    }

    private _loadData() {
        this.healthCheckpointsSubject.subscribe(checkpoints => {
            if (checkpoints) {

                checkpoints.forEach((checkpoint, index) => {
                    this._analysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, checkpoint.category, checkpoint.detector, false, '', '').subscribe((response: IDetectorResponse) => {
                        this._handleResponse(response, checkpoint.detector);
                        if (index == this.selectedCategoryIndex) {
                            this.setCategory(this.selectedCategoryIndex);
                        }
                    }, error => {
                        checkpoint.loadingStatus = LoadingStatus.Failed;
                    });
                });
                this.onComplete.emit({ status: true });
            }
        });

    }

    private _handleResponse(data: IDetectorResponse, detectorId: string) {
        switch (detectorId) {
            case 'runtimeavailability':
                this._handleRuntimeAvailabilityResponse(data);
                break;
            case 'sitelatency':
                this._handleSiteLatencyResponse(data);
                break;
            case 'sitecpuanalysis':
                this._handleCpuResponse(data);
                break;
            case 'sitememoryanalysis':
                this._handleMemoryResponse(data);
                break;
        }
    }

    private _handleRuntimeAvailabilityResponse(data: IDetectorResponse) {
        const category = this.healthCheckpoints.find(entry => entry.detector.toLowerCase() === 'runtimeavailability');

        const requestMetrics = data.metrics.filter(p => (p.name.toLowerCase().indexOf('availability') < 0));
        category.graphData = GraphHelper.parseMetricsToChartData(requestMetrics, 0, true);
        let currentAppHealth;
        if (data.data && data.data.length > 0) {
            currentAppHealth = data.data[0].find(p => p.name.toLocaleLowerCase() === 'currentapphealth');
        }

        if (currentAppHealth && currentAppHealth.value.toLocaleLowerCase() === 'unhealthy') {
            category.healthStatus = HealthStatus.Critical;
            category.healthStatusMessage = 'Your Web App is currently experiencing HTTP server errors. Please "View Full Report" to see more detailed observations and quick solutions.';
        } else {

            if (data.abnormalTimePeriods && data.abnormalTimePeriods.length > 0) {
                category.healthStatus = HealthStatus.Warning;
                category.healthStatusMessage = 'Your Web App is currently running healthy. However, we have detected downtime in the last 24 hours during which your Web App was experiencing errors. Please "View Full Report" to see more detailed observations and troubleshooting advice.';
            } else {
                category.healthStatus = HealthStatus.Success;
                category.healthStatusMessage = 'Your Web App is currently running healthy. Check out "View Full Report" if you would like to check the availability of your Web App from the last 24 hours.';
            }
        }

        category.loadingStatus = LoadingStatus.Success;

        this.healthCheckResultForLogging.push(`Availability-${this._getLevelIndicator(category.healthStatus)}`);
    }

    private _handleSiteLatencyResponse(data: IDetectorResponse) {
        const category = this.healthCheckpoints.find(entry => entry.detector.toLowerCase() === 'sitelatency');

        category.graphData = GraphHelper.parseMetricsToChartData(data.metrics);
        if (category.graphData && category.graphData.length > 0) {
            category.graphData.forEach(element => {
                if (element.key === '90th Percentile' || element.key === '95th Percentile') {
                    element.disabled = true;
                }
            });
        }

        if (data.abnormalTimePeriods && data.abnormalTimePeriods.length > 0) {
            category.healthStatus = HealthStatus.Warning;
            category.healthStatusMessage = 'Your Web App has experienced performance issues in the last 24 hours. Please "View Full Report" to further analyze your Web App response time and view troubleshooting advice.';
        } else {
            category.healthStatus = HealthStatus.Success;
            category.healthStatusMessage = 'Your Web App currently has no performance issues. Check out "View Full Report" if you would like to check your Web App response time.';
        }

        category.loadingStatus = LoadingStatus.Success;

        this.healthCheckResultForLogging.push(`Performance-${this._getLevelIndicator(category.healthStatus)}`);

    }

    private _handleCpuResponse(data: IDetectorResponse) {
        const category = this.healthCheckpoints.find(entry => entry.detector.toLowerCase() === 'sitecpuanalysis');

        const metrics = data.metrics.filter(p => (p.name.toLowerCase().indexOf('percent') > -1));
        category.graphData = GraphHelper.parseMetricsToChartDataPerInstance(metrics);

        let currentHealth;
        if (data.data && data.data.length > 0) {
            currentHealth = data.data[0].find(p => p.name.toLocaleLowerCase() === 'currenthealth');
        }

        if (currentHealth && currentHealth.value.toLocaleLowerCase() === 'unhealthy') {
            category.healthStatus = HealthStatus.Critical;
            category.healthStatusMessage = 'Your Web App is currently experiencing high CPU usage. Please "View Full Report" to further analyze your CPU usage per instance breakdown.';
        } else {
            if (data.abnormalTimePeriods && data.abnormalTimePeriods.length > 0) {
                category.healthStatus = HealthStatus.Warning;
                category.healthStatusMessage = 'Your Web App has experienced high CPU usage in the last 24 hours. Please "View Full Report" to further analyze your CPU usage per instance breakdown.';
            } else {
                category.healthStatus = HealthStatus.Success;
                category.healthStatusMessage = 'Your Web App currently has normal CPU usage. Check out "View Full Report" if you would like to check the CPU usage per instance breakdown.';
            }
        }

        category.loadingStatus = LoadingStatus.Success;

        this.healthCheckResultForLogging.push(`CPU Usage-${this._getLevelIndicator(category.healthStatus)}`);
    }

    private _handleMemoryResponse(data: IDetectorResponse) {
        const category = this.healthCheckpoints.find(entry => entry.detector.toLowerCase() === 'sitememoryanalysis');

        const memoryMetrics = data.metrics.filter(p => (p.name.toLowerCase().indexOf('percent') > -1));
        category.graphData = GraphHelper.parseMetricsToChartDataPerInstance(memoryMetrics);

        let currentHealth;
        if (data.data && data.data.length > 0) {
            currentHealth = data.data[0].find(p => p.name.toLocaleLowerCase() === 'currenthealth');
        }

        if (currentHealth && currentHealth.value.toLocaleLowerCase() === 'unhealthy') {
            category.healthStatus = HealthStatus.Critical;
            category.healthStatusMessage = 'Your Web App is currently experiencing high memory usage. Please "View Full Report" to further analyze your memory usage per instance breakdown.';
        } else {
            if (data.abnormalTimePeriods && data.abnormalTimePeriods.length > 0) {
                category.healthStatus = HealthStatus.Warning;
                category.healthStatusMessage = 'Your Web App has experienced high memory usage in the last 24 hours. Please "View Full Report" to further analyze your memory usage per instance breakdown.';
            } else {
                category.healthStatus = HealthStatus.Success;
                category.healthStatusMessage = 'Your Web App currently has normal memory usage. Check out "View Full Report" if you would like to check the memory usage per instance breakdown.';
            }
        }

        category.loadingStatus = LoadingStatus.Success;

        this.healthCheckResultForLogging.push(`Memory Usage-${this._getLevelIndicator(category.healthStatus)}`);
    }

    private _getLevelIndicator(level: HealthStatus): string {

        switch (HealthStatus[level].toLowerCase()) {
            case 'warning':
                return 'yellow';
            case 'error':
                return 'red';
            default:
                return 'green';
        }
    }
}
