import { Component, Input, OnInit } from '@angular/core';
import { HealthStatus, LoadingStatus, StatusStyles, TelemetryEventNames, TelemetryService } from 'diagnostic-data'
import { RiskTile, RiskInfo } from '../../models/risk';
@Component({
  selector: 'risk-tile',
  templateUrl: './risk-tile.component.html',
  styleUrls: ['./risk-tile.component.scss']
})
export class RiskTileComponent implements OnInit {
  StatusStyles = StatusStyles;
  LoadingStatus = LoadingStatus;
  title: string = "";
  linkText: string = "";
  infoList: RiskInfoDisplay[] = [];
  loading = LoadingStatus.Loading;
  showTile: boolean = true;
  riskProperties = { "TileLoaded": LoadingStatus[LoadingStatus.Loading] };
  get loadingAriaLabel() {
    return `loading ${this.title}`;
  }

  @Input() risk: RiskTile;
  constructor(private telemetryService: TelemetryService) { }


  ngOnInit() {
    this.title = this.risk.title;
    this.riskProperties["Title"] = this.title;
    this.linkText = this.risk.linkText;
    this.showTile = this.risk.showTile;
    this.risk.infoObserverable.subscribe(info => {
      if (info !== null && info !== undefined && Object.keys(info).length > 0) {
        this.infoList = this.processRiskInfo(info);
        this.loading = LoadingStatus.Success;
        this.riskProperties["TileLoaded"] = LoadingStatus[this.loading];
        this.logEvent(TelemetryEventNames.RiskTileLoaded, {});
      }
    }, e => {
      this.loading = LoadingStatus.Failed;
      this.riskProperties["TileLoaded"] = LoadingStatus[this.loading];
      this.infoList = [
        {
          message: "No data available",
          status: HealthStatus.Info
        }
      ];
      this.logEvent(TelemetryEventNames.RiskTileLoaded, {
        "LoadingError":e
      });
    });
  }

  clickTileHandler() {
    this.logEvent(TelemetryEventNames.RiskTileClicked, {});
    this.risk.action();
  }

  private processRiskInfo(info: RiskInfo): RiskInfoDisplay[] {
    const statuses = Object.values(info);
    const map = new Map<HealthStatus, number>();

    for (const status of statuses) {
      const count = map.has(status) ? map.get(status) : 0;
      map.set(status, count + 1);
    }

    this.copyStatusToRiskProps(map);

    //sort from most critical to less critical
    const sortedStatus = Array.from(map.keys());
    sortedStatus.sort((s1, s2) => s1 - s2);

    //get 2 most critical ones
    const res: RiskInfoDisplay[] = [];
    if (sortedStatus.length >= 1) {
      res.push(new RiskInfoDisplay(sortedStatus[0], map.get(sortedStatus[0])));
    }

    if (sortedStatus.length >= 2) {
      res.push(new RiskInfoDisplay(sortedStatus[1], map.get(sortedStatus[1])));
    }

    return res;
  }

  private logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
    for (const id of Object.keys(this.riskProperties)) {
      if (this.riskProperties.hasOwnProperty(id)) {
        eventProperties[id] = String(this.riskProperties[id]);
      }
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }

  private copyStatusToRiskProps(map: Map<HealthStatus, number>) {
    const keys = Array.from(map.keys());
    for (let status of keys) {
      this.riskProperties[HealthStatus[status]] = map.get(status);
    }
  }
}

class RiskInfoDisplay {
  message: string;
  status: HealthStatus;

  constructor(status: HealthStatus, count: number) {
    this.status = status;
    this.message = `${count} ${HealthStatus[status]}`;
  }
}