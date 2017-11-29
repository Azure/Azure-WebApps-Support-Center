import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IMetricSet } from '../../../shared/models/detectorresponse';
import { SummaryViewModel, SummaryHealthStatus } from '../../../shared/models/summary-view-model';
import { ChartType } from '../../../shared/models/chartdata';
import { AvailabilityLoggingService } from '../../../shared/services';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';

@Component({
    selector: 'expandable-summary',
    templateUrl: 'expandable-summary.component.html',
    styleUrls: ['expandable-summary.component.css']
})
export class ExpandableSummaryComponent implements OnInit {

    healthStatus: any = SummaryHealthStatus;
    lineChart: ChartType = ChartType.lineChart;

    summaryModel: SummaryViewModel;
    expanded: boolean = false;
    metricsContainData: boolean = false; 

    mainMetricSets: IMetricSet[];
    detailMetricSets: IMetricSet[];

    markupString: string;

    @Input() title: string;
    
    private _summaryViewModelSubject: BehaviorSubject<SummaryViewModel> = new BehaviorSubject<SummaryViewModel>(null);

    @Input() set summaryViewModel(value: SummaryViewModel) {
        this._summaryViewModelSubject.next(value);
    }

    constructor(private _logger: AvailabilityLoggingService) {
    }

    ngOnInit(): void {
        this._summaryViewModelSubject.subscribe(value => {
            if (value) {
                this.summaryModel = value;
                this.mainMetricSets = this.summaryModel.mainMetricSets;
                this.detailMetricSets = this.summaryModel.detailMetricSets;

                this.mainMetricSets.forEach(element => {
                    if (element.values.length > 0)
                    {
                        this.metricsContainData = true;
                    }
                });
               
                let abnormalTimePeriod = this.summaryModel.detectorAbnormalTimePeriod;
                if (abnormalTimePeriod && abnormalTimePeriod.metaData.length > 0) {
                    let markupStringNameValuePair = abnormalTimePeriod.metaData[0].find(x => x.name === "MarkupString");
                    this.markupString = markupStringNameValuePair ? markupStringNameValuePair.value : null;
                }
            }
        });
    }

    toggleExpanded(): void {
        this._logger.LogSummaryViewExpanded(this.summaryModel.detectorName, this.summaryModel.health);
        this.expanded = !this.expanded
    }
}