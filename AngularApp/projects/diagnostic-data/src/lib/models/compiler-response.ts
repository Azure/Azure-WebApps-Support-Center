export interface CompilerResponse {
    compilationSucceeded: boolean;
    compilationTraces: string[];
    references: string[];
    assemblyBytes: string;
    pdbBytes: string;
    assemblyName: string;
    scriptETag: string;
}

export interface QueryResponse<T> {
    compilationOutput: CompilerResponse;
    runtimeSucceeded: boolean;
    invocationOutput: T;
}
