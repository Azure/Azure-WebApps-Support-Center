import { Injectable, OnInit, Inject, Input } from '@angular/core';
import { AppInsights, } from 'applicationinsights-js';
import { ITelemetryProvider } from './telemetry.common';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { SeverityLevel } from '../../models/telemetry';

@Injectable()
export class AppInsightsTelemetryService implements ITelemetryProvider {

    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) private config: DiagnosticDataConfig) {
        if (!AppInsights.config) {
            AppInsights.downloadAndSetup({
                instrumentationKey: config.InstrumentationKey,
                maxBatchSizeInBytes: 1,
                maxBatchInterval: 1
            });
        }
    }

    public logPageView(name?: string, url?: string, properties?: any, measurements?: any, duration?: number) {
        AppInsights.trackPageView(name, url, properties, measurements, duration);
    }

    public logEvent(message?: string, properties?: any, measurements?: any) {
        AppInsights.trackEvent(message, properties, measurements);
    }

    public logException(exception: Error, handledAt?: string, properties?: any, measurements?: any, severityLevel?: SeverityLevel) {
        AppInsights.trackException(exception, handledAt, properties, measurements, severityLevel);
    }

    public logTrace(message: string, customProperties?: any, customMetrics?: any) {
        AppInsights.trackTrace(message, customProperties);
    }

    public logMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: any) {
        AppInsights.trackMetric(name, average, sampleCount, min, max, properties);
    }

    public flush() {
        AppInsights.flush();
    }
}
