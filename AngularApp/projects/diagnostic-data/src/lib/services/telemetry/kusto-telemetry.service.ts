import { Injectable } from '@angular/core';
import {ITelemetryProvider} from './telemetry.common';


@Injectable()
export class KustoTelemetryService implements ITelemetryProvider {

    constructor() {
    }

    logEvent(message?: string, properties?: any, measurements?: any) {}

    logException(exception: Error, handledAt?: string, properties?: any, measurements?: any, severityLevel?: any) {}

    logPageView(name: string, url: string, properties?: any, measurements?: any, duration?: number) {}

    logTrace(message: string, customProperties?: any, customMetrics?: any) {}

    logMetric(name: string, average: number, sampleCount: number, min: number, max: number, properties?: any) {}

    flush() {}
}
