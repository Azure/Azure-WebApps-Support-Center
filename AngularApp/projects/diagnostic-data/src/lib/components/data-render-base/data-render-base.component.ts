import { Component, OnInit, Input } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { DiagnosticData, RenderingType } from '../../models/detector';
import * as momentNs from 'moment';
import { TelemetryService } from '../../services/telemetry/telemetry.service';

@Component({
  templateUrl: './data-render-base.component.html'
})
export class DataRenderBaseComponent implements OnInit, DataRenderer {

  protected DataRenderingType: RenderingType;

  private _diagnosticDataSubject: ReplaySubject<DiagnosticData> = new ReplaySubject<DiagnosticData>(1);

  @Input() set diagnosticDataInput(detector: DiagnosticData) {
    this._diagnosticDataSubject.next(detector);
  };

  diagnosticData: DiagnosticData;

  @Input() startTime: momentNs.Moment;
  @Input() endTime: momentNs.Moment;
  @Input() detectorEventProperties: any;

  constructor(protected telemetryService: TelemetryService) {
  }

  ngOnChanges() {
  }

  ngOnInit() {
    this._diagnosticDataSubject.subscribe((data: DiagnosticData) => {
      this.processData(data);
    });
  }

  protected processData(data: DiagnosticData) {
    if (data) {
      this.diagnosticData = data;
    }
  }

  protected logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
    for (let id in this.detectorEventProperties) {
      eventProperties[id] = String(this.detectorEventProperties[id]);
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }
}

export interface DataRenderer {
  diagnosticDataInput: DiagnosticData;
}
