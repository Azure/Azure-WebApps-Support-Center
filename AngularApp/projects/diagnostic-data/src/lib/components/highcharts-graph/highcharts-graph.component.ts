import * as momentNs from 'moment';
import { Component, Input, OnInit } from '@angular/core';
import { TimeSeriesType } from '../../models/detector';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';
import * as HC_customEvents_ from 'highcharts-custom-events';
import AccessibilityModule from 'highcharts/modules/accessibility';
import { DetectorControlService } from '../../services/detector-control.service';

const HC_customEvents = HC_customEvents_;
HC_exporting(Highcharts);
AccessibilityModule(Highcharts);
HC_customEvents(Highcharts);

const moment = momentNs;

@Component({
    selector: 'highcharts-graph',
    templateUrl: './highcharts-graph.component.html',
    styleUrls: ['./highcharts-graph.component.scss']
})
export class HighchartsGraphComponent implements OnInit {
    Highcharts: typeof Highcharts = Highcharts;
    options: any;

    @Input() HighchartData: any = [];

    @Input() chartDescription: string = "";

    @Input() chartType: TimeSeriesType;

    @Input() chartOptions: any;

    @Input() startTime: momentNs.Moment;

    @Input() endTime: momentNs.Moment;

    loading: boolean = true;

    constructor(private detectorControlService: DetectorControlService) {
    }

    ngOnInit() {
        this._setOptions();
        this._updateOptions();

        setTimeout(() => {
            this.loading = false;
        }, 100);
    }

    private _updateOptions() {

        let type: string = 'line';
        let stacking = undefined;

        if (this.chartType) {
            // stacking:
            // Undefined to disable
            // "Normal" to stack by value
            // "Stack" by "percent".
            switch (this.chartType as TimeSeriesType) {
                case TimeSeriesType.StackedAreaGraph:
                    type = 'area';
                    stacking = 'normal';
                    break;
                case TimeSeriesType.StackedBarGraph:
                    type = 'column';
                    stacking = 'normal';
                    break;
                case TimeSeriesType.BarGraph:
                    type = 'column';
                    break;
                case TimeSeriesType.LineGraph:
                default:
                    type = 'line';
                    break;
            }
        }


        if (this.chartOptions && this.chartOptions["type"]) {
            type = this.chartOptions["type"];
        }

        if (this.chartOptions && this.chartOptions["stacking"]) {
            stacking = this.chartOptions["stacking"];
        }

        this.options.chart.type = type;
        this.options.plotOptions.series.stacking = stacking;

        if (this.chartOptions) {
            this._updateObject(this.options, this.chartOptions);
        }

        if (this.startTime && this.endTime) {
            this.options.forceX = [this.startTime, this.endTime];
        }
    }

    private _updateObject(obj: Object, replacement: any): Object {
        // The option keys are different from nvd3. eg. In order to override default colors,
        // use "colors" as key  instead of "color"
        Object.keys(replacement).forEach(key => {
            const subItem = obj[key];
            const replace = replacement[key];

            // Below returns true if subItem is an object
            if (subItem === Object(subItem)) {
                obj[key] = this._updateObject(subItem, replace);
            } else {
                // Special handling for the key to override colors. In highchart library, the key should be "colors" instead of "colors"
                if (key === "color" || key === "colors")
                {
                    key = "colors";
                }
                obj[key] = replace;
            }
        });

        return obj;
    }


    private _setOptions() {
        this.options = {
            title: {
                text: ""
            },
            credits: {
                enabled: false
            },
            accessibility: {
                enabled: true,
                describeSingleSeries: true,
                description: `${this.chartDescription}`,
                keyboardNavigation: {
                    enabled: true,
                    mode: "normal",
                    order: ["legend", "series", "zoom", "rangeSelector", "chartMenu"],
                    focusBorder: {
                        style: {
                            lineWidth: 3,
                            color: '#aa1111',
                            borderRadius: 5
                        },
                        margin: 4
                    },
                    wrapAround: true,
                    skipNullPoints: true
                },
            },
            caption: {
                text: `${this.chartDescription}`,
            },
            chart: {
                reflow: true,
                height: 300,
                display: 'block!important',
                type: 'line',
                zoomType: 'x',
                panKey: 'shift',
                panning: true,
                resetZoomButton: {
                    position: {
                        x: 0,
                        y: -10
                    }
                },
            },
            legend: {
                enabled: true,
                align: 'center',
                layout: 'horizontal',
                verticalAlign: 'top',
                itemStyle: { "color": "#333", "cursor": "pointer", "fontSize": "12px", "textOverflow": "ellipsis", "font-weight": "normal", "font-family": " Arial, sans-serif" },
                itemMarginTop: 0,
                itemMarginBottom: 0,
                accessibility: {
                    enabled: true,
                    keyboardNavigation: {
                        enabled: true
                    }
                }
            },
            plotOptions: {
                series: {
                    showInLegend: true,
                    lineWidth: 1.5,
                    negativeColor: 'red',
                    accessiblity: {
                        enabled: true,
                        keyboardNavigation: {
                            enabled: true
                        }
                    }
                }
            },
            tooltip: {
                shared: true,
                enabled: true,
                valueDecimals: 2,
                useHTML: true,
                outside: true,
                backgroundColor: "white",
            },
            navigation: {
                buttonOptions: {
                    y: -10,
                    theme: {
                        'stroke-width': 0,
                        stroke: 'silver',
                        r: 0,
                        states: {
                            hover: {
                                fill: '#ddd'
                            },
                            select: {
                                stroke: '#039',
                                fill: '#ddd'
                            }
                        }
                    }
                },
                menuStyle: {
                    border: "1px solid #999999",
                    height: 1
                },
                menuItemStyle: {
                    padding: "0.1em 1em",
                }
            },
            exporting: {
                accessibility: {
                    enabled: true,
                },
                buttons: {
                    DeselectAllButton: {
                        text: 'None',
                        onclick: function () {
                            var series = this.series;
                            for (var i = 0; i < series.length; i++) {
                                series[i].setVisible(false, false);
                            }
                        }
                    },
                    SelectAllButton: {
                        text: 'All',
                        onclick: function () {
                            var series = this.series;
                            for (var i = 0; i < series.length; i++) {
                                series[i].setVisible(true, false);
                            }
                        }
                    }
                },

            },
            xAxis: {
                accessibility: {
                    description: `Time(UTC) from ${this.startTime} to ${this.endTime}`
                },
                type: 'datetime',
                title: {
                    text: 'Time (UTC)',
                },
                tickSize: 10,
                crosshair: true,
                tickFormat: function (d: any) { return moment(d).utc().format('MM/DD HH:mm'); },
                dateTimeLabelFormats: {
                    second: '%m-%d %H:%M:%S',
                    minute: '%m-%d %H:%M',
                    hour: '%m-%d %H:%M',
                    day: '%Y-%m-%d',
                    week: '%Y-%m-%d',
                    month: '%Y-%m',
                    year: '%Y'
                },
                labels: {
                    style: {
                        whiteSpace: 'nowrap'
                    }
                },
            },
            yAxis: {
                tickAmount: 3,
                softMin: 0,
                crosshair: true,
                accessibility: {
                    description: `Y axis values`
                },
                title: {
                    text: '',
                    style: {
                        whiteSpace: 'nowrap'
                    }
                },
                endOnTick: false,
                labels: {
                    format: '{value:.2f}',
                    style: {
                        whiteSpace: 'nowrap'
                    }
                },
            },
            series: this.HighchartData
        } as Highcharts.Options;
    }
}

export interface GraphPoint {
    x: momentNs.Moment;
    y: number;
}

export interface GraphSeries {
    key: string;
    values: GraphPoint[];
}

export interface HighchartsData {
    x: momentNs.Moment;
    y: number;
    name: string;
    color: string;
}

export interface HighchartGraphSeries {
    name: string;
    type: string;
    data: any;
    events: Function;
    accessibility: any;
}
