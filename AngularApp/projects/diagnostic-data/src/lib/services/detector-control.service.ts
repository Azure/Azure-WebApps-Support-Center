import { Injectable, Inject } from '@angular/core';
import * as momentNs from 'moment';
import { BehaviorSubject } from 'rxjs';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../config/diagnostic-data-config';

const moment = momentNs;

@Injectable()
export class DetectorControlService {

  readonly stringFormat: string = 'YYYY-MM-DD HH:mm';

  durationSelections: DurationSelector[] = [
    {
      displayName: '1h',
      duration: momentNs.duration(1, 'hours'),
      internalOnly: false
    },
    {
      displayName: '6h',
      duration: momentNs.duration(6, 'hours'),
      internalOnly: false
    },
    {
      displayName: '1d',
      duration: momentNs.duration(1, 'days'),
      internalOnly: false
    },
    {
      displayName: '3d',
      duration: momentNs.duration(3, 'days'),
      internalOnly: true
    }
  ];

  private _duration: DurationSelector;
  private _startTime: momentNs.Moment;
  private _endTime: momentNs.Moment;

  // TODO: allow for this to be changed with dropdown
  private _internalView = true;

  public internalClient: boolean = false;

  private _error: string;

  private _shouldRefresh: boolean;

  private _refresh: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    this.internalClient = !config.isPublic;
  }

  public get update() {
    return this._refresh;
  }

  public setDefault() {
    this.selectDuration(this.durationSelections.find(duration => duration.displayName === '1d'));
  }

  public setCustomStartEnd(start?: string, end?: string): void {
    this._duration = null;
    let startTime, endTime: momentNs.Moment;
    if (start && end) {
      startTime = moment.utc(start);
      endTime = moment.utc(end);
    } else if (start) {
      startTime = moment.utc(start);
      endTime = startTime.clone().add(1, 'days');
    } else if (end) {
      endTime = moment.utc(end);
      startTime = endTime.clone().subtract(1, 'days');
    } else {
      this.selectDuration(this.durationSelections[2]);
      return;
    }

    this._startTime = startTime;
    this._endTime = endTime;

    this._refreshData();
  }

  public selectDuration(duration: DurationSelector) {
    this._duration = duration;
    this._startTime = moment.utc().subtract(duration.duration);
    this._endTime = this._startTime.clone().add(duration.duration);
    this._refreshData();
  }

  public moveForwardDuration(): void {
    this._startTime.add(this._duration.duration);
    this._endTime.add(this._duration.duration);
    this._refreshData();
  }

  public moveBackwardDuration(): void {
    this._startTime.subtract(this._duration.duration);
    this._endTime.subtract(this._duration.duration);
    this._refreshData();
  }

  public refresh() {
    this._duration ? this.selectDuration(this._duration) : this._refreshData();
  }

  public toggleInternalExternal() {
    this._internalView = !this._internalView;
    this._refreshData();
  }

  private _refreshData() {
    this._shouldRefresh = true;
    this._refresh.next(true);
  }

  public get error(): string {
    return this._error;
  }

  public get startTime(): momentNs.Moment { return this._startTime; }

  public get endTime(): momentNs.Moment { return this._endTime; }

  public get duration(): DurationSelector { return this._duration; }

  public get startTimeString(): string { return this.startTime.format(this.stringFormat); }

  public get endTimeString(): string { return this.endTime.format(this.stringFormat); }

  public get isInternalView(): boolean { return this._internalView; }

  public get shouldRefresh(): boolean {
    const temp = this._shouldRefresh;
    this._shouldRefresh = false;
    return temp;
  }

}

export interface DurationSelector {
  displayName: string;
  duration: momentNs.Duration;
  internalOnly: boolean;
}
