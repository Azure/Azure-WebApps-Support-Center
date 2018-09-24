import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { IMetricSet } from '../../models/detectorresponse';
import { ReplaySubject } from 'rxjs'
import { GraphHelper } from '../../utilities/graphHelper';
import { ChartSeries, ChartType } from '../../models/chartdata';

@Component({
    selector: 'instance-view-graph',
    templateUrl: 'instance-view-graph.component.html',
    styleUrls: ['instance-view-graph.component.css']
})
export class InstanceViewGraphComponent implements OnInit {
    constructor() {
        this.chartOptions = GraphHelper.getDefaultChartOptions();
        this.chartType = ChartType.lineChart;
    }

    private _metricSetsSubject: ReplaySubject<IMetricSet[]> = new ReplaySubject<IMetricSet[]>(1);

    @Input() set metricSets(value: IMetricSet[]) {
        this._metricSetsSubject.next(value);
    }

    @Input() selectedInstance: string;

    @Output() updateInstance: EventEmitter<string> = new EventEmitter<string>();

    @Input() title: string;
    @Input() chartType: ChartType;
    @Input() yAxisLabel: string;
    @Input() description: string;

    allChartData: ChartSeries[];
    allInstances: string[];
    chartData: ChartSeries[];
    chartOptions: any;

    ngOnInit() {
        this._metricSetsSubject.subscribe((metricSets: IMetricSet[]) => {
            if (metricSets) {
                this.chartOptions.chart.type = ChartType[this.chartType].toString();
                this.chartOptions.chart.yAxis.axisLabel = this.yAxisLabel;
                this.chartOptions.chart.margin.bottom = 40;
                this.allChartData = GraphHelper.parseMetricsToChartDataPerInstance(metricSets, 0, false);
                this.allChartData.forEach(series => series.key = series.metricName);
                this.allInstances = this.allChartData.map(series => series.roleInstance).filter((v, i, a) => a.indexOf(v) === i);
                if (this.allInstances.length > 0) {
                    this.selectInstance(this.selectedInstance && this.selectedInstance !== '' ? this.selectedInstance : this.allChartData[0].roleInstance);
                }
            }
        });
    }

    selectInstance(instance: string) {
        this.selectedInstance = instance;
        this.chartData = this.allChartData.filter((series: ChartSeries) => series.roleInstance === this.selectedInstance);
        this.updateInstance.emit(this.selectedInstance);
    }
}