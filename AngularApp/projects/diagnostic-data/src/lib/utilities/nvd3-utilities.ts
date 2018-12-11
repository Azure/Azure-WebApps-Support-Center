import { TimeSeriesType } from "../models/detector";

export class nvd3Utilities {
    public static getChartType(chartType: TimeSeriesType) {
        let type: string;

        switch (chartType as TimeSeriesType) {
            case TimeSeriesType.StackedAreaGraph: 
                type = 'stackedAreaChart';
                break;
            case TimeSeriesType.BarGraph:
                type = 'multiBarChart';
                break;
            case TimeSeriesType.LineGraph:
            default:
                type = 'lineChart';
                break;
        }

        return type;
    }
}