import { Component, OnInit } from '@angular/core';
import { IAppAnalysisResponse, IAbnormalTimePeriod, IAnalysisData } from '../../../shared/models/appanalysisresponse';
import { IDetectorAbnormalTimePeriod, IDetectorResponse } from '../../../shared/models/detectorresponse';
import { SummaryViewModel, SummaryHealthStatus } from '../../../shared/models/summary-view-model';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { ActivatedRoute } from '@angular/router';
import { AvailabilityLoggingService } from '../../../shared/services/index';
import { MetaDataHelper } from '../../../shared/utilities/metaDataHelper';
import  '../../../shared/polyfills/string'

@Component({
    selector: 'tcpconnections-analysis',
    templateUrl: 'tcp-connections-analysis.component.html'
})
export class TcpConnectionsAnalysisComponent implements OnInit {
    displayGraph: boolean = true;

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

    constructor(private _route: ActivatedRoute, private _appAnalysisService: AppAnalysisService, private _logger: AvailabilityLoggingService) {

    }

    ngOnInit(): void {
        this._logger.LogAnalysisInitialized('TCP Connections Analysis');

        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

        this.getSummaryViewModel(this.ConnectionRejections, 'Port Rejection', false)
        .subscribe(data => {
        this.connnectionsRejectionsViewModel = data;
        });

        this.getSummaryViewModel(this.TcpConnections, 'Outbound', false)
            .subscribe(data => {
            this.connectionsUsageViewModel = data;
            });

        this.getSummaryViewModel(this.OpenSocketCount, 'TotalOpenSocketCount', false)
            .subscribe(data => {
            this.openSocketCountViewModel = data;
            });
    }

   getSummaryViewModel(detectorName: string, topLevelSeries: string = '', excludeTopLevelInDetail: boolean = true): Observable<SummaryViewModel> {

        let graphMetaData = this.graphMetaData[detectorName];

        return this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, "availability", detectorName)
            .map(detectorResponse => {
                let downtime = detectorResponse.abnormalTimePeriods[0] ? detectorResponse.abnormalTimePeriods[0] : null;
                let health = downtime ? SummaryHealthStatus.Warning :  SummaryHealthStatus.Healthy;
                
                if (detectorResponse.abnormalTimePeriods.length > 0)
                {
                    let abnormalTimePeriodMessage = this.getAbnormalTimePeriodMessageFromMetadata(detectorName, detectorResponse);
                    detectorResponse.abnormalTimePeriods[0].message = abnormalTimePeriodMessage;
                }

                return <SummaryViewModel>{
                    detectorName: detectorName,
                    health: health,
                    loading: false,
                    detectorAbnormalTimePeriod: detectorResponse.abnormalTimePeriods[0],
                    renderAbnormalTimePeriodAsHtml:true,
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

    getAbnormalTimePeriodMessageFromMetadata(detectorName:string, detectorResponse:IDetectorResponse):string
    {
        let message = detectorResponse.abnormalTimePeriods[0].message;

        if (detectorName == this.OpenSocketCount)
        {
            let issueType = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "IssueType");
            let instance = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "Instance");
            let siteName = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "SiteName");
            let processName = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "ProcessName");
            let processId = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "ProcessId");            
            let handleCount = MetaDataHelper.getMetaDataValue(detectorResponse.abnormalTimePeriods[0].metaData, "HandleCount");

            if (issueType == "HigSocketHandleCount" || issueType == "HighSocketHandleCount")
            {
                message = "<b>High Open Socket handle count</b> detected on instance - " + instance + ". ";
            }
            else if (issueType == "SocketHandlesLeaked")
            {
                message = "<b>Socket handle leak</b> detected on instance - " + instance + ". It was detected that the TCP Connections were not high on the instance however the open socket handle count on the instance was high.";
            }
            
            let msg = "During this time frame, the process with the maximum handle count (<b>{3}</b>) belonged to :-<ul><li>WebApp - {0}</li><li>Process - {1}</li><li>ProcessId - {2}</li></ul>";
            message = message + msg.format(siteName, processName, processId, handleCount);
    
        }

        else if (detectorName == this.TcpConnections)
        {
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
}