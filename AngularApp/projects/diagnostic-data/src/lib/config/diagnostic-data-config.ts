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
    useKustoForTelemetry: true,
    useAppInsightsForTelemetry: true,
    // Application Insight resource: applensloggingprod
    InstrumentationKey: '48ab2838-0cc5-44b4-8504-f5e4b8ee3c72',
};

export const INTERNAL_DEV_CONFIGURATION: DiagnosticDataConfig = {
    production: false,
    isPublic: false,
    useKustoForTelemetry: true,
    useAppInsightsForTelemetry: true,
    // Application Insight resource: applenslogging
    InstrumentationKey: '0f12994c-a067-4841-bd77-3b082f8ed3de',
};

export const PUBLIC_PROD_CONFIGURATION: DiagnosticDataConfig = {
    production: true,
    isPublic: true,
    useKustoForTelemetry: true,
    useAppInsightsForTelemetry: true,
    // Application Insight resource: supportcenterlogging
    // This is the application instance consumed by portal project production environment
    InstrumentationKey: 'a4eccd35-91b2-41c9-884b-b44e7e8590f7',
};

export const PUBLIC_DEV_CONFIGURATION: DiagnosticDataConfig = {
    production: false,
    isPublic: true,
    useKustoForTelemetry: true,
    useAppInsightsForTelemetry: true,
     // Application Insight resource: supportcenterloggingprod
     // The name is a little confusing, but this is the application instance for  portal project dev environment logging
    InstrumentationKey: 'c182b26a-f21a-4ae7-86db-b26dc1b2cab9',
};

export const DIAGNOSTIC_DATA_CONFIG = new InjectionToken<DiagnosticDataConfig>('app.config');
