import { IDetectorAbnormalTimePeriod, IMetricSet, IDetectorMetaData } from './detectorresponse';
import { ISolution } from './solution';
import { IDetectorDefinition } from './detectordefinition';
import {INameValuePair} from './namevaluepair';

export interface IAppAnalysisResponse {
    startTime: string;
    endTime: string;
    abnormalTimePeriods: IAbnormalTimePeriod[];
    payload: IAnalysisData[];
    nonCorrelatedDetectors: IDetectorDefinition[]
}

export interface IAbnormalTimePeriod {
    startTime: string;
    endTime: string;
    events: IDetectorAbnormalTimePeriod[];
    solutions: ISolution[];
}

export interface IAnalysisData{
    source:string;
    detectorDefinition: IDetectorDefinition;
    metrics: IMetricSet[];
    data: INameValuePair[][];
    detectorMetaData: IDetectorMetaData;
}