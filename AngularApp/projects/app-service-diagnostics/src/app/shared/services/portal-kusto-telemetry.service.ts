import { PortalService } from './../../startup/services/portal.service';
import { Injectable } from '@angular/core';
import { ITelemetryProvider } from 'diagnostic-data';

@Injectable()
export class PortalKustoTelemetryService implements ITelemetryProvider {

  constructor(private _portalService: PortalService) {
  }

  logEvent(eventMessage: string, properties: { [name: string]: string }, measurements?: any) {
    // measurements is ignored
    console.log(properties);
    this._portalService.logAction('diagnostic-data', eventMessage, properties);
  }

  logException() {
  }

  logMetric() {
  }

  logTrace() {
  }

  logPageView() {
  }

  logUserInteraction() {
  }

  flush() {
  }
}
