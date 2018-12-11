import { Injectable } from '@angular/core';
import {ITelemetryProvider} from './telemetry.common';


@Injectable()
export class KustoTelemetryService implements ITelemetryProvider {

    constructor() {
    }

    logEvent() {
    }

    logException() {
    }

    logMetric() { 
    }


    logTrace(){
    }

    logPageView(){
    }

    logUserInteraction() {
    }

    flush(){
    }
}
