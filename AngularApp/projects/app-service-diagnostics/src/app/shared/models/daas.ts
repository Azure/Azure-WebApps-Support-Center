export enum DiagnosisStatus {
    NotRequested,
    WaitingForInputs,
    InProgress,
    Error,
    Cancelled,
    Complete
}

export interface DiagnoserStatusMessage {
    EntityType: string;
    Message: string;
}

export enum SessionStatus {
    Active,
    CollectedLogsOnly,
    Cancelled,
    Error,
    Complete
}

export interface Log {
    StartTime: string;
    EndTime: string;
    RelativePath: string;
    FileName: string;
    FullPermanentStoragePath: string;
}

export interface Report {
    StartTime: string;
    EndTime: string;
    RelativePath: string;
    FileName: string;
    FullPermanentStoragePath: string;
}

export interface Diagnoser {

    Name: string;
    CollectorStatus: DiagnosisStatus;
    CollectorStatusMessages: DiagnoserStatusMessage[];
    AnalyzerStatus: DiagnosisStatus;
    AnalyzerStatusMessages: DiagnoserStatusMessage[];
    CollectorErrors: string[];
    AnalyzerErrors: string[];
    Logs: Log[];
    Reports: Report[];
}

export class Session {
    StartTime: string;
    EndTime: string;
    SessionId: string;
    Description: string;
    Instances: string[];
    RunLive: boolean;
    CollectLogsOnly: boolean;
    Diagnosers: string[];
    TimeSpan: string;
    DiagnoserSessions: Diagnoser[];
    Status: SessionStatus;
    Expanded: boolean;
    Deleting: boolean = false;
    DeletingFailure: string = '';
    LogFilesSize: number;
    BlobSasUri: string;
    HasBlobSasUri: boolean = false;
}

export interface DiagnoserDefinition {
    Name: string;
    Warnings: string[];
    Description: string;
}

export interface DatabaseTestConnectionResult {
    Name: string;
    ConnectionString: string;
    ProviderName: string;
    ExceptionDetails: ExceptionDetails;
    Succeeded: boolean;
    DatabaseType: ConnectionDatabaseType;
    Instance: string;
    DummyValueExistsInWebConfig: boolean;
    FilePath: string;
    LineNumber: number;
    IsEnvironmentVariable: boolean;
    MaskedConnectionString: string;
    DisplayClearText: boolean;
    Expanded: boolean;
}

export enum ConnectionDatabaseType {
    SqlDatabase = 0,
    SqlServer,
    MySql,
    Custom,
    Dynamic,
    NotSupported,
    PostgreSql,
    RedisCache
}

export interface ExceptionDetails {
    ClassName: string;
    Message: string;
    Data: any;
    StackTraceString: string;
    RemoteStackTraceString: string;
    HResult: number;

}
export enum AnalysisStatus {
    NotStarted,
    InProgress,
    Completed
}

export enum SessionMode {
    Kill = "Kill",
    Collect = "Collect",
    CollectAndKill = "CollectAndKill",
    CollectKillAndAnalyze = "CollectKillAndAnalyze"
}

export class MonitoringSession {
    Mode: SessionMode;
    SessionId: string;
    StartDate: string;
    EndDate: string;
    ProcessesToMonitor: string;
    MonitorScmProcess: boolean;
    CpuThreshold: number;
    ThresholdSeconds: number;
    MonitorDuration: number;
    ActionToExecute: string;
    ArgumentsToAction: string;
    MaxActions: number;
    MaximumNumberOfHours: number;
    FilesCollected: MonitoringFile[];
    AnalysisStatus: AnalysisStatus;
    AnalysisSubmitted: boolean = false;
    ErrorSubmittingAnalysis: string = "";
}

export interface MonitoringFile {
    FileName: string;
    RelativePath: string
    ReportFile: string;
    ReportFileRelativePath: string;
    AnalysisErrors: string[];
}

export interface ActiveMonitoringSession {
    Session: MonitoringSession;
    MonitoringLogs: MonitoringLogsPerInstance[];
}

export interface MonitoringLogsPerInstance {
    Instance: string;
    Logs: string
}

export interface DaasAppInfo {
    Framework: string;
    FrameworkVersion: string;
    AspNetCoreVersion: string;
    CoreProcessName: string;
    LoggingLevel: string;
}

export class DaasSettings {
    Diagnosers: any[] = [];
    TimeSpan: string;
    BlobSasUri: string;
    BlobContainer: string;
    BlobKey: string;
    BlobAccount: string;
}

export class DaasValidationResult {
    Validated: boolean = false;
    BlobSasUri: string = "";
}