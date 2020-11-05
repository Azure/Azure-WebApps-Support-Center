import { Component, Input, OnInit } from '@angular/core';
import { HealthStatus, StatusStyles, TelemetryEventNames, TelemetryService } from 'diagnostic-data'
import { RiskTile, RiskInfo } from '../../models/risk';
@Component({
  selector: 'risk-tile',
  templateUrl: './risk-tile.component.html',
  styleUrls: ['./risk-tile.component.scss']
})
export class RiskTileComponent implements OnInit {
  StatusStyles = StatusStyles;
  title: string = "";
  linkText: string = "";
  infoList: RiskInfoDisplay[] = [];
  loading: boolean = true;
  showTile: boolean = true;
  get loadingAriaLabel() {
    return `loading ${this.title}`;
  }

  @Input() risk: RiskTile;
  constructor(private telemetryService: TelemetryService) { }


  ngOnInit() {
    this.title = this.risk.title;
    this.linkText = this.risk.linkText;
    this.showTile = this.risk.showTile;
    this.risk.infoObserverable.subscribe(info => {
      if (info !== null && info !== undefined && Object.keys(info).length > 0) {
        this.infoList = this._processRiskInfo(info);
        this.loading = false;
      }
    }, e => {
      this.loading = false;
      this.infoList = [
        {
          message: "No data available",
          status: HealthStatus.Info
        }
      ];
    });
  }

  clickTileHandler() {
    const eventProps = {
      'Name': this.title
    }
    
    //Log status and count
    if(!this.loading){
      for(let info of this.infoList){
        const status = HealthStatus[info.status];
        const message = info.message;
        if(message.indexOf(status) > -1){
          const index = message.indexOf(status);
          const count = Number.parseInt(message.substring(0,index));
          eventProps[status] = count;
        }
      }
    }

    this.telemetryService.logEvent(TelemetryEventNames.RiskTileClicked,eventProps);
    this.risk.action();
  }

  private _processRiskInfo(info: RiskInfo): RiskInfoDisplay[] {
    const statuses = Object.values(info);
    const map = new Map<HealthStatus, number>();

    for (const status of statuses) {
      const count = map.has(status) ? map.get(status) : 0;
      map.set(status, count + 1);
    }

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
}

class RiskInfoDisplay {
  message: string;
  status: HealthStatus;

  constructor(status: HealthStatus, count: number) {
      this.status = status;
      this.message = `${count} ${HealthStatus[status]}`;
  }
}