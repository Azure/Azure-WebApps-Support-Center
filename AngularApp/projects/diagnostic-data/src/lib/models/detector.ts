
export interface ArmObject {
    id: string;
    name: string;
    type: string;
}

export interface DetectorResponse {
    dataset: DiagnosticData[];
    metadata: DetectorMetaData;
    status: Status;
  dataProvidersMetadata: DataProviderMetadata[];
  suggestedUtterances: any;
}

export interface Status {
    statusId: HealthStatus;
    message: string;
}

export enum HealthStatus {
    Critical,
    Warning,
    Info,
    Success,
    None,
    Onboarding
}

export interface DiagnosticData {
    table: DataTableResponseObject;
    renderingProperties: any; // This is any so that we can correctly case it depending on rendering type
}

export interface DataTableResponseObject {
    // tableName: string;
    columns: DataTableResponseColumn[];
    rows: any[][];
}

export interface DataTableResponseColumn {
    columnName: string;
    dataType: string;
    columnType: string;
}

export interface DetectorMetaData {
    id: string;
    name: string;
    description: string;
    author: string;
    supportTopicList: SupportTopic[];
    analysisTypes: string[];
    type: DetectorType;
    category: string;
    score: number;
}

export interface DataProviderMetadata {
    providerName: string;
    propertyBag: PropertyBag[];

}

export interface PropertyBag {
    key: string;
    value: any;
}

export interface KustoPropertyBagValue {
    text: string;
    url: string;
}

export interface SupportTopic {
    id: string;
    pesId: string;
}

export enum DetectorType{
    Detector = "Detector",
    Analysis = "Analysis"
}
export enum RenderingType {
    NoGraph = 0,
    Table,
    TimeSeries,
    TimeSeriesPerInstance,
    PieChart,
    DataSummary,
    Email,
    Insights,
    DynamicInsight,
    Markdown,
    DetectorList,
    DropDown,
    Cards,
    Solution,
    Guage,
    Form,
    ChangeSets,
    ChangeAnalysisOnboarding,
    ChangesView,
    ApplicationInsightsView,
    DependencyGraph
}

export enum TimeSeriesType {
    LineGraph = 0,
    BarGraph,
    StackedAreaGraph,
    StackedBarGraph
}

export class DataTableDataType {
    static Boolean: string = 'Boolean';
    static Byte: string = 'Byte';
    static DateTime: string = 'DateTime';
    static Double: string = 'Double';
    static Int16: string = 'Int16';
    static Int32: string = 'Int32';
    static Int64: string = 'Int64';
    static String: string = 'String';

    static NumberTypes: string[] = [ DataTableDataType.Double, DataTableDataType.Int64, DataTableDataType.Int32, DataTableDataType.Int16 ];
}

export interface Rendering {
    type: RenderingType;
    title: string;
    description: string;
}

export interface DataTableRendering extends Rendering {
    groupByColumnName: string;
    displayColumnNames: string[];
}

export interface TimeSeriesRendering extends Rendering {
    defaultValue: number;
    graphType: TimeSeriesType;
    graphOptions: any;
    timestampColumnName: string;
    counterColumnName: string;
    seriesColumns: string[];
}

export interface TimeSeriesPerInstanceRendering extends Rendering {
    defaultValue: number;
    graphType: TimeSeriesType;
    graphOptions: any;
    timestampColumnName: string;
    roleInstanceColumnName: string;
    counterColumnName: string;
    valueColumnName: string;
    instanceFilter: string[];
    counterNameFilter: string[];
    selectedInstance: string;
}

export interface InsightsRendering extends Rendering {
    insightColumnName: string;
    statusColumnName: string;
    nameColumnName: string;
    valueColumnName: string;
    typeColumnName: string;
}

export interface DynamicInsightRendering extends Rendering {
    status: HealthStatus;
    innerRendering: Rendering;
    expanded: boolean;
}

export interface DetectorListRendering extends Rendering {
    detectorIds: string[];
}

export interface MarkdownRendering extends Rendering {
    isContainerNeeded: boolean;
}

export interface RecommendedUtterance {
  sampleUtterance: SampleUtterance;
  score: number;
}

interface SampleUtterance {
  text: string;
  links: string[];
}
