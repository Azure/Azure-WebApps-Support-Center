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
    FullPermanentStoragePath: string
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
    ExceptionDetails: ExceptionDetails
    Succeeded: boolean;
    DatabaseType: number;
    Instance: string;
    DummyValueExistsInWebConfig: boolean;
    FilePath: string;
    LineNumber: number;
    IsEnvironmentVariable: boolean;
    MaskedConnectionString: string;
}

export interface ExceptionDetails {
    ClassName: string;
    Message: string;
    Data: any;
    StackTraceString: string;
    RemoteStackTraceString: string;
    HResult: number;

}