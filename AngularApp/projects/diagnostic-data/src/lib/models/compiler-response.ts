export interface CompilerResponse {
    compilationSucceeded: boolean;
    compilationTraces: string[];
    references: string[];
    assemblyBytes: string;
    pdbBytes: string;
    assemblyName: string;
    scriptETag: string;
}

export interface RuntimeException {
    ClassName: string;
    Message: string;
    source: string;
    StackTraceString: string;
}

export interface RuntimeResponse {
    timeStamp: string;
    level: string;
    category: string;
    message: string;
    exception: RuntimeException;
    eventId: number;
}

export interface QueryResponse<T> {
    compilationOutput: CompilerResponse;
    runtimeSucceeded: boolean;
    runtimeLogOutput: RuntimeResponse[];
    invocationOutput: T;
}
