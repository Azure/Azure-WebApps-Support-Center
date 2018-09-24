import { Component, OnInit } from '@angular/core';
import { IAppAnalysisResponse, IAbnormalTimePeriod, IAnalysisData } from '../../../shared/models/appanalysisresponse';
import { IDetectorAbnormalTimePeriod, IDetectorResponse } from '../../../shared/models/detectorresponse';
import { SummaryViewModel, SummaryHealthStatus } from '../../../shared/models/summary-view-model';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';

import { Observable } from 'rxjs'
import { ActivatedRoute } from '@angular/router';
import { MetaDataHelper } from '../../../shared/utilities/metaDataHelper';
import '../../../shared/polyfills/string'
import { IMyDpOptions, IMyDate, IMyDateModel } from 'mydatepicker';
import { GraphHelper } from '../../../shared/utilities/graphHelper';
import { AvailabilityLoggingService } from '../../../shared/services/logging/availability.logging.service';

@Component({
    selector: 'tcpconnections-analysis',
    templateUrl: 'tcp-connections-analysis.component.html'
})
export class TcpConnectionsAnalysisComponent implements OnInit {
    displayGraph: boolean = true;
    refreshingConnnectionsRejections:boolean = false;
    refreshingConnectionsUsage:boolean = false;
    refreshingOpenSocketCount:boolean = false;

    connnectionsRejectionsViewModel: SummaryViewModel;
    connectionsUsageViewModel: SummaryViewModel;
    openSocketCountViewModel: SummaryViewModel;

    readonly ConnectionRejections: string = "portrejections";
    readonly TcpConnections: string = "tcpconnectionsusage";
    readonly OpenSocketCount: string = "tcpopensocketcount";

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;
    
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

    constructor(private _route: ActivatedRoute, private _appAnalysisService: AppAnalysisService, private _logger: AvailabilityLoggingService) {

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

    }

    private _loadData(startDate: string = '', invalidateCache: boolean = false): void {


        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

        this.getSummaryViewModel(this.ConnectionRejections, 'Port Rejection', false, startDate, invalidateCache)
            .subscribe(data => {
                this.connnectionsRejectionsViewModel = data;
                this.refreshingConnnectionsRejections = false;
            });

        this.getSummaryViewModel(this.TcpConnections, 'Outbound', false, startDate, invalidateCache)
            .subscribe(data => {
                this.connectionsUsageViewModel = data;
                this.refreshingConnectionsUsage = false;
            });

        this.getSummaryViewModel(this.OpenSocketCount, 'TotalOpenSocketCount', false, startDate, invalidateCache)
            .subscribe(data => {
                this.openSocketCountViewModel = data;
                this.refreshingOpenSocketCount = false;
            });
    }

    ngOnInit(): void {
        this._logger.LogAnalysisInitialized('TCP Connections Analysis');
        this._loadData();
    }

    getSummaryViewModel(detectorName: string, topLevelSeries: string = '', excludeTopLevelInDetail: boolean = true, startDate: string = '', invalidateCache: boolean = false): Observable<SummaryViewModel> {

        let graphMetaData = this.graphMetaData[detectorName];

        return this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, "availability", detectorName, invalidateCache, startDate)
            .map(detectorResponse => {
                let downtime = detectorResponse.abnormalTimePeriods[0] ? detectorResponse.abnormalTimePeriods[0] : null;
                let health = downtime ? SummaryHealthStatus.Warning : SummaryHealthStatus.Healthy;

                if (detectorResponse.abnormalTimePeriods.length > 0) {
                    let abnormalTimePeriodMessage = this.getAbnormalTimePeriodMessageFromMetadata(detectorName, detectorResponse);
                    detectorResponse.abnormalTimePeriods[0].message = abnormalTimePeriodMessage;
                }

                return <SummaryViewModel>{
                    detectorName: detectorName,
                    health: health,
                    loading: false,
                    detectorAbnormalTimePeriod: detectorResponse.abnormalTimePeriods[0],
                    renderAbnormalTimePeriodAsHtml: true,
                    detectorData: null,
                    mainMetricSets: detectorResponse ? (topLevelSeries !== '' ? detectorResponse.metrics.filter(x => x.name === topLevelSeries) : detectorResponse.metrics) : null,
                    detailMetricSets: topLevelSeries !== '' && detectorResponse ? excludeTopLevelInDetail ? detectorResponse.metrics.filter(x => x.name !== topLevelSeries) : detectorResponse.metrics : null,
                    mainMetricGraphTitle: graphMetaData.mainGraphTitle,
                    mainMetricGraphDescription: graphMetaData.mainGraphDescriptions,
                    perInstanceGraphTitle: graphMetaData.perInstanceGraphTitle,
                    perInstanceGraphDescription: graphMetaData.perInstanceGraphDescription,
                    emptyDataResponse: graphMetaData.emptyDataResponse
                };
            });
    }

    getAbnormalTimePeriodMessageFromMetadata(detectorName: string, detectorResponse: IDetectorResponse): string {
        let message = detectorResponse.abnormalTimePeriods[0].message;

        if (detectorName === this.OpenSocketCount) {
            let issueType = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "IssueType");
            let instance = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "Instance");
            let siteName = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "SiteName");
            let processName = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "ProcessName");
            let processId = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "ProcessId");
            let handleCount = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "HandleCount");

            if (issueType === "HigSocketHandleCount" || issueType === "HighSocketHandleCount") {
                message = "<b>High Open Socket handle count</b> detected on instance - " + instance + ". ";
            }
            else if (issueType === "SocketHandlesLeaked") {
                message = "<b>Socket handle leak</b> detected on instance - " + instance + ". It was detected that the TCP Connections were not high on the instance, however the open socket handle count on the instance was high.";
            }

            let msg = "During this time frame, the process with the maximum handle count (<b>{3}</b>) belonged to :-<ul><li>WebApp - {0}</li><li>Process - {1}</li><li>ProcessId - {2}</li></ul>";
            message = message + msg.format(siteName, processName, processId, handleCount);

        }

        else if (detectorName === this.TcpConnections) {
            let total = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "Total");
            let remoteAddress = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "RemoteAddress");
            let established = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "Established");
            let timeWait = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "TimeWait");
            let instance = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "Instance");

            message = "<b>High TCP Connections</b> detected on " + instance;
            +("<ul><li>A total of <b>{0}</b> outbound connections (Established :{1} , TimeWait :{2}) detected to remote endpoint with IP Address <b>{3}</b></li></ul>")
                .format(total, established, timeWait, remoteAddress);
        }

        return message;
    }

    private graphMetaData: any = {
        'portrejections': {
            mainGraphTitle: 'TCP Connection Rejections',
            mainGraphDescriptions: 'Connection Rejections is the number of times your application\'s request to open a new connection failed because the machine wide TCP Connection limit was hit',
            perInstanceGraphTitle: null,
            perInstanceGraphDescription: null,
            emptyDataResponse: 'No issues detected with port rejections in this time frame.'
        },
        'tcpconnectionsusage': {
            mainGraphTitle: 'Outbound TCP Connections',
            mainGraphDescriptions: 'This is the total number of Outbound Connections per Instance',
            perInstanceGraphTitle: 'TCP Connections',
            perInstanceGraphDescription: 'The below graph shows connections (both Inbound and Outbound) per instance. Established and TimeWait include both Inbound and Outbound connections'
        },
        'tcpopensocketcount': {
            mainGraphTitle: 'Open Socket handles',
            mainGraphDescriptions: 'This represents the total number of open socket handles per instance',
            perInstanceGraphTitle: 'Open Socket handles per Instance',
            perInstanceGraphDescription: 'The below graph represents the WebApp and the processes under the WebApp which have the maximum Open Socket handle count on this instance',
            emptyDataResponse: 'Open Socket count information is displayed only if the Outbound TCP Connections crosses 95% of the machine-wide TCP Connection limit.'

        }
    }

    RefreshData(event: IMyDateModel): void {

        this._logger.LogClickEvent('Date Filter', 'TCP Connections Analysis');
        this._logger.LogMessage(`New Date Selected :${event.formatted}`);
        let currentDate: Date = GraphHelper.convertToUTCTime(new Date());       

        var dateFilter = event.formatted;
        if (`${event.date.year}-${event.date.month}-${event.date.day}` === `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`) {
            dateFilter = '';
        }        
        this.refreshingConnectionsUsage = true;
        this.refreshingConnnectionsRejections = true;
        this.refreshingOpenSocketCount = true;
        this._loadData(dateFilter, true);
    }
}