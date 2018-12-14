export interface CompilerResponse {
    compilationSucceeded: boolean;
    compilationOutput: string[];
    assemblyBytes: string;
    pdbBytes: string;
}

export interface QueryResponse<T> {
    compilationOutput: CompilerResponse;
    runtimeSucceeded: boolean;
    invocationOutput: T;
}
