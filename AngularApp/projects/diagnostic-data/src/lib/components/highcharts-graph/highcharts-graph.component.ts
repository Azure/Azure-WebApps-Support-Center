import * as momentNs from 'moment';
import { Component, Input, OnInit, HostListener, ElementRef, Output, EventEmitter } from '@angular/core';
import { TimeSeriesType } from '../../models/detector';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';
import * as HC_customEvents_ from 'highcharts-custom-events';
import AccessibilityModule from 'highcharts/modules/accessibility';
import { DetectorControlService } from '../../services/detector-control.service';
import { HighChartTimeSeries } from '../../models/time-series';
import { xAxisPlotBand, xAxisPlotBandStyles, zoomBehaviors, XAxisSelection } from '../../models/time-series';
import { KeyValue } from '@angular/common';

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

    private _xAxisPlotBands: xAxisPlotBand[] = null;
    @Input() public set xAxisPlotBands(value: xAxisPlotBand[]) {
        this._xAxisPlotBands = [];
        this._xAxisPlotBands = value;
        if (value != null && !this.loading) {
            this._updateOptions();
            this.rebindChartOptions();
        }
    }
    public get xAxisPlotBands() {
        return this._xAxisPlotBands;
    }

    public static chartProperties: { [chartContainerId: string]: KeyValue<string, any>[] } = {};
    public static getChartProperty(propertyName: string, chartContainerId: string): any {
        if (chartContainerId != '') {
            let retVal = null;
            if (!!this.chartProperties[chartContainerId] && this.chartProperties[chartContainerId].length > 0) {
                this.chartProperties[chartContainerId].some(prop => {
                    if (prop.key == propertyName) {
                        retVal = prop.value;
                        return true;
                    }
                });
            }
            return retVal;
        }
        else {
            return null;
        }
    }
    public static addOrUpdateChartProperty(propertyName: string, propertyValue: any, chartContainerId: string): boolean {
        if (chartContainerId == '') {
            return false;
        }
        else {
            let existingValue = HighchartsGraphComponent.getChartProperty(propertyName, chartContainerId);
            if (!!existingValue) {
                HighchartsGraphComponent.chartProperties[chartContainerId].some(prop => {
                    if (prop.key == propertyName) {
                        prop.value = propertyValue;
                        return true;
                    }
                });
            }
            else {
                if (HighchartsGraphComponent.chartProperties[chartContainerId] == null) {
                    HighchartsGraphComponent.chartProperties[chartContainerId] = [];
                }
                HighchartsGraphComponent.chartProperties[chartContainerId].push({
                    key: propertyName,
                    value: propertyValue
                } as KeyValue<string, any>);
            }
            return true;
        }
    }

    private _zoomBehavior: zoomBehaviors = zoomBehaviors.Zoom;
    @Input() public set zoomBehavior(value: zoomBehaviors) {
        this._zoomBehavior = value;
        setTimeout(() => {
            HighchartsGraphComponent.addOrUpdateChartProperty('zoomBehavior', this._zoomBehavior, this.getCurrentChartContainerId());
        }, 500);
    }
    public get zoomBehavior() {
        return this._zoomBehavior;
    }

    @Output() XAxisSelection: EventEmitter<XAxisSelection> = new EventEmitter<XAxisSelection>();

    private getCurrentChartContainerId(): string {
        if (this.el.nativeElement.getElementsByClassName('highcharts-container') && this.el.nativeElement.getElementsByClassName('highcharts-container').length > 0) {
            return this.el.nativeElement.getElementsByClassName('highcharts-container')[0].id;;
        }
        else {
            return '';
        }
    }

    private getCurrentChart(): Highcharts.Chart {
        let currentId = this.getCurrentChartContainerId();
        if (currentId == '') {
            return null;
        }
        for (let i = 0; i < Highcharts.charts.length; i++) {
            let chart = Highcharts.charts[i];
            if (chart) {
                if (currentId === chart.container.id) {
                    return chart;
                }
            }
        }
        return null;
    }

    highchartCallback: Highcharts.ChartLoadCallbackFunction = function() {
        var chart:any = this;
        chart.customNamespace = {};
        chart.customNamespace["toggleSelectionButton"] = chart.renderer.button(
            'Select None', null, -10, function () {
                var series = chart.series;
                var statusToSet = this.text && this.text.textStr && this.text.textStr === "Select All" ? true : false;
                for (var i = 0; i < series.length; i++) {
                    series[i].setVisible(statusToSet, false);
                }
                statusToSet = !statusToSet;
                var textStr = statusToSet ? "Select All": "Select None";
                var ariaLabel= statusToSet ? "Select all the series" : "Deselect all the series";
                this.attr({
                    text: textStr,
                    "aria-label": ariaLabel,
                });
            }, null, null, null, null, null, true).add();

            var namespace = chart.customNamespace || {};
            if (namespace["toggleSelectionButton"]) {
                namespace["toggleSelectionButton"].attr({
                    role: 'button',
                    tabindex: -1,
                    x: chart.plotWidth -115,
                    "aria-label": "Deselect all the series",
                });
            }

        var ToggleSelectionButton = function toggleSelectionButton(chart) {
            this.initBase(chart);
        };

        ToggleSelectionButton.prototype = new Highcharts.AccessibilityComponent();
        Highcharts.extend(ToggleSelectionButton.prototype, {
            // Define keyboard navigation for this component
            getKeyboardNavigation: function () {
                var keys = this.keyCodes,
                    chart = this.chart,
                    namespace = chart.customNamespace || {},
                    component = this;

                return new Highcharts.KeyboardNavigationHandler(chart, {
                    keyCodeMap: [
                        // On arrow/tab we just move to the next chart element.
                        [[
                            keys.tab, keys.up, keys.down, keys.left, keys.right
                        ], function (keyCode, e) {
                            return this.response[
                                keyCode === this.tab && e.shiftKey ||
                                    keyCode === keys.left || keyCode === keys.up ?
                                    'prev' : 'next'
                            ];
                        }],

                        // Space/enter means we click the button
                        [[
                            keys.space, keys.enter
                        ], function () {
                            // Fake a click event on the button element
                            var buttonElement = namespace["toggleSelectionButton"] &&
                                namespace["toggleSelectionButton"].element;
                            if (buttonElement) {
                                component.fakeClickEvent(buttonElement);
                            }
                            return this.response.success;
                        }]
                    ],

                    // Focus button initially
                    init: function () {
                        var buttonElement = namespace["toggleSelectionButton"] &&
                            namespace["toggleSelectionButton"].element;
                        if (buttonElement && buttonElement.focus) {
                            buttonElement.focus();
                        }
                    }
                });
            }
        });

        chart.update({
            accessibility: {
                customComponents: {
                 toggleSelectionButton: new ToggleSelectionButton(chart),
                },
                keyboardNavigation: {
                    order: ["legend", "series", "zoom", "rangeSelector", "toggleSelectionButton"],
                }
            }
        });
    };

    private customChartSelectionCallbackFunction: Highcharts.ChartSelectionCallbackFunction = (event: Highcharts.ChartSelectionContextObject) => {
        if (this._zoomBehavior & zoomBehaviors.FireXAxisSelectionEvent) {
            if (!!event.xAxis) {
                let fromSelection = moment.utc(Highcharts.dateFormat('%Y-%m-%d %H:%M:00', event.xAxis[0].min));
                let toSelection = moment.utc(Highcharts.dateFormat('%Y-%m-%d %H:%M:00', event.xAxis[0].max));

                let fromPoint = null;
                let toPoint = null;
                let currChart = this.getCurrentChart();
                if (!!currChart && !!currChart.series && currChart.series.length > 0) {
                    let firstNonEmptySeries: number = -1;
                    for (let index = 0; index < currChart.series.length; index++) {
                        if (currChart.series[index].visible && currChart.series[index].xAxis.hasData()) {
                            firstNonEmptySeries = index;
                            break;
                        }
                    }
                    if (firstNonEmptySeries > -1) {
                        currChart.series[firstNonEmptySeries].points.forEach(pt => {
                            if (moment.duration(moment.utc(Highcharts.dateFormat('%Y-%m-%d %H:%M:00', pt.x)).diff(fromSelection)).asMinutes() < 4) {
                                fromPoint = moment.utc(Highcharts.dateFormat('%Y-%m-%d %H:%M:00', pt.x));
                            }
                            if (toPoint == null && moment.duration(moment.utc(Highcharts.dateFormat('%Y-%m-%d %H:%M:00', pt.x)).diff(toSelection)).asMinutes() > -4) {
                                toPoint = moment.utc(Highcharts.dateFormat('%Y-%m-%d %H:%M:00', pt.x));
                            }
                        });
                    }

                    if (!!fromPoint && !!toPoint) {
                        let xAxisSelectionEventArgs = new XAxisSelection();
                        xAxisSelectionEventArgs.chart = currChart;
                        xAxisSelectionEventArgs._rawEventArgs = event;
                        xAxisSelectionEventArgs.fromTime = fromPoint;
                        xAxisSelectionEventArgs.toTime = toPoint;
                        this.XAxisSelection.emit(xAxisSelectionEventArgs);
                    }
                }
            }
        }
        if (this.zoomBehavior & zoomBehaviors.CancelZoom) {
            return false;
        }
        else {
            return true;
        }
    };

    private customSetExtremesCallbackFunction: Highcharts.AxisSetExtremesEventCallbackFunction = (evt: Highcharts.AxisSetExtremesEventObject) => {
        if (evt.trigger !== 'sync') { // Prevent feedback loop
            let currChart = this.getCurrentChart();
            if (!currChart) {
                return;
            }
            for (let i = 0; i < Highcharts.charts.length; i++) {
                let chart = Highcharts.charts[i];
                if (chart && currChart !== chart) {
                    let targetZoomBehavior: zoomBehaviors = HighchartsGraphComponent.getChartProperty('zoomBehavior', chart.container.id) as zoomBehaviors;
                    if (targetZoomBehavior == null || !(targetZoomBehavior & zoomBehaviors.CancelZoom)) {
                        if (chart.xAxis[0].setExtremes) { // It is null while updating
                            chart.xAxis[0].setExtremes(evt.min, evt.max, true, true, { trigger: 'sync' });
                        }
                    }
                }
            }
        }
    };

    private rebindChartOptions(): void {
        let currChart = this.getCurrentChart();
        if (!!currChart) {
            currChart.update(this.options);
        }
    }

    loading: boolean = true;

    @HostListener('mousemove', ['$event'])
    onMouseMove(ev: MouseEvent) {
        this.syncCharts(ev);
    }

    @HostListener('keydown', ['$event'])
    onKeydownHandler(ev: KeyboardEvent) {
        var key = ev.key;

        if (key === 'ArrowLeft' || key === 'ArrowRight') {
            let currentId = this.el.nativeElement.getElementsByClassName('highcharts-container')[0].id;

            for (let i = 0; i < Highcharts.charts.length; i++) {
                let chart = Highcharts.charts[i];

                if (chart) {
                    let xi = chart.xAxis[0];
                    xi.removePlotLine("myPlotLine");
                    if (currentId === chart.container.id && !xi.crosshair) {
                        xi.crosshair = true;
                    }
                }
            }
        }
    }

    constructor(private detectorControlService: DetectorControlService, private el: ElementRef<HTMLElement>) {
    }

    ngOnInit() {
        this._setOptions();
        this._updateOptions();

        setTimeout(() => {
            this.loading = false;
        }, 100);
    }

    private syncCharts(ev: MouseEvent) {
        let xAxisValue: number;

        let currentCharts = this.el.nativeElement.getElementsByClassName('highcharts-container');
        if (!currentCharts || !currentCharts[0]) {
            return;
        }
        let currentId = currentCharts[0].id;

        // Find out which is the current chart object
        for (let i = 0; i < Highcharts.charts.length; i++) {
            let chart = Highcharts.charts[i];
            if (chart) {
                if (currentId === chart.container.id) {
                    //Add width of side-nav in Diag&Solve so cursor will align with vertical line
                    const sideNav = <HTMLElement>document.getElementById('sidebar');
                    let sideNavWidth = sideNav ? sideNav.offsetWidth : 0;
                    let bbLeft = this.el.nativeElement.offsetLeft + chart.plotLeft + sideNavWidth;

                    // Get the timestamp value where mouse is hovering
                    xAxisValue = chart.xAxis[0].toValue(ev.pageX - bbLeft, true);
                    chart.xAxis[0].crosshair = false;
                    break;
                }
            }
        }

        for (let i = 0; i < Highcharts.charts.length; i++) {
            let chart = Highcharts.charts[i];
            if (chart) {
                let xi = chart.xAxis[0];
                xi.removePlotLine("myPlotLine");
                xi.addPlotLine({
                    value: xAxisValue,
                    width: 1,
                    color: 'grey',
                    id: 'myPlotLine',
                    zIndex: 10
                });
            }
        }
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

        if (!!this.xAxisPlotBands && this.xAxisPlotBands.length > 0) {
            let chartPlotBands = [];
            this.xAxisPlotBands.forEach(plotBand => {
                var currPlotBand = {
                    color: plotBand.color == '' ? '#FCFFC5' : plotBand.color,
                    from: plotBand.from.utc(true),
                    to: plotBand.to.utc(true),
                    zIndex: !!plotBand.style ? plotBand.style : xAxisPlotBandStyles.BehindPlotLines,
                    borderWidth: (!!plotBand.borderWidth && plotBand.borderWidth > 0) ? plotBand.borderWidth : 0,
                    borderColor: (!!plotBand.borderColor) ? plotBand.borderColor : 'white',
                    id: (!!plotBand.id) ? plotBand.id : ''
                };
                chartPlotBands.push(currPlotBand);

            });
            this.options.xAxis.plotBands = chartPlotBands;
        }

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
                if (key === "color" || key === "colors") {
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
                    order: ["legend", "series", "zoom", "rangeSelector"],
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
            chart: {
                reflow: true,
                height: 300,
                display: 'block!important',
                type: 'line',
                // styledMode: true,
                zoomType: 'x',
                panKey: 'shift',
                panning: true,
                resetZoomButton: {
                    position: {
                        x: 0,
                        y: -57
                    }
                },
                events: {
                    selection: this.customChartSelectionCallbackFunction,
                    load: this.highchartCallback,
                    render: function() {
                        var chart:any = this;
                        chart.customNamespace["toggleSelectionButton"].attr({
                            x: this.plotWidth -115,
                        });
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
                    contextButton: {
                        enabled: false,
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
                crosshair: false,
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
                plotBands: [],
                events: {
                    setExtremes: this.customSetExtremesCallbackFunction
                }
            },
            yAxis: {
                tickAmount: 3,
                softMin: 0,
                crosshair: true,
                gridLineColor: "#929294",
                gridLineWidth: 0,
                minorGridLineWidth: 0,
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
        } as Highcharts.Options
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
