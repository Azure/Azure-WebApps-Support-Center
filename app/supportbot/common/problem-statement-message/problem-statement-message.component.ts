import { Component, Injector, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { ButtonActionType } from '../../models/message';
import { IMetricSet, IDetectorResponse } from '../../../shared/models/detectorresponse';
import { BotLoggingService, AppAnalysisService } from '../../../shared/services';
import { Message } from '../../models/message';
import { ChartType } from '../../../shared/models/chartdata';

@Component({
    templateUrl: 'problem-statement-message.component.html'
})
export class ProblemStatementMessageComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    loading: boolean = true;

    detectorMetrics: IMetricSet[];
    instanceDetailMetrics: IMetricSet[];

    detectorMetricsTitle: string;
    detectorMetricsDescription: string;
    instanceDetailTitle: string;
    instanceDetailDescription: string;

    detectorResponse: IDetectorResponse;

    metricsChartType: ChartType = ChartType.lineChart

    constructor(private injector: Injector, private _logger: BotLoggingService, private _route: ActivatedRoute,  private _appAnalysisService: AppAnalysisService) {
        this.detectorMetricsTitle = "Overall CPU Usage per Instance";
        this.detectorMetricsDescription = "This graphs shows the total CPU usage on each of the instances where your application is running. " +
            "Below you can look at a specific instance and see how much CPU each app is consuming."
        this.instanceDetailTitle = "App CPU Usage Breakdown";
        this.instanceDetailDescription = "This shows the average CPU usage, in percent out of 100, for each application in the given time window."
    
    }

    ngOnInit(): void {
        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

        this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'sitecpuanalysis').subscribe(response => {
            this.detectorResponse = response;
        });
    }

    ngAfterViewInit(): void {
        this.onViewUpdate.emit();
        
        this.onComplete.emit({
            status: true
        });
    }
}

export class ProblemStatementMessage extends Message {
    constructor(messageDelayInMs: number = 500) {
        //TODO: add solution data
        super(ProblemStatementMessageComponent, {}, messageDelayInMs);
    }
}