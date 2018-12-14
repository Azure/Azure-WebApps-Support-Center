import { InjectionToken } from '@angular/core';

export interface DiagnosticDataConfig {
    production: boolean;
    isPublic: boolean;
    useKustoForTelemetry?: boolean;
    useAppInsightsForTelemetry?: boolean;
    InstrumentationKey?: string;
}

export const INTERNAL_PROD_CONFIGURATION: DiagnosticDataConfig = {
    production: true,
    isPublic: false,
    useKustoForTelemetry: false,
    useAppInsightsForTelemetry: true,
    InstrumentationKey: '48ab2838-0cc5-44b4-8504-f5e4b8ee3c72'   // Application Insight resource: applensloggingprod
};

export const INTERNAL_DEV_CONFIGURATION: DiagnosticDataConfig = {
    production: false,
    isPublic: false,
    useKustoForTelemetry: false,
    useAppInsightsForTelemetry: true,
    InstrumentationKey: '0f12994c-a067-4841-bd77-3b082f8ed3de',   // Application Insight resource: applenslogging
};

export const PUBLIC_PROD_CONFIGURATION: DiagnosticDataConfig = {
    production: true,
    isPublic: true,
    useKustoForTelemetry: false,
    useAppInsightsForTelemetry: true,
    InstrumentationKey: 'a4eccd35-91b2-41c9-884b-b44e7e8590f7', // Application Insight resource: supportcenterlogging
};

export const PUBLIC_DEV_CONFIGURATION: DiagnosticDataConfig = {
    production: false,
    isPublic: true,
    useKustoForTelemetry: false,
    useAppInsightsForTelemetry: true,
    InstrumentationKey: 'c182b26a-f21a-4ae7-86db-b26dc1b2cab9' // Application Insight resource: supportcenterloggingprod
};

export const DIAGNOSTIC_DATA_CONFIG = new InjectionToken<DiagnosticDataConfig>('app.config');
