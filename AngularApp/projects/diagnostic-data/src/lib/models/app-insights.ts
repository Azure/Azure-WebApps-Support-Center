import {  DiagnosticData } from '../models/detector';

export class AppInsightQueryMetadata {
    title: string;
    description: string;
    query: string;
    poralBladeInfo: BladeInfo;
    renderingProperties: any;
  }
  
  export class AppInsightData {
    title: string;
    description: string;
    table: any;
    poralBladeInfo: BladeInfo;
    renderingProperties: any;
    diagnosticData: DiagnosticData;
  }
  
  export class BladeInfo
  {
      bladeName: string;
      description: string;
  }