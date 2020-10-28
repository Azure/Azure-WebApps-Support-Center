import { Component, Input, OnInit } from '@angular/core';
import { HealthStatus, TelemetryService } from 'diagnostic-data'
import { PortalActionService } from '../../../shared/services/portal-action.service';
@Component({
  selector: 'risk-tile',
  templateUrl: './risk-tile.component.html',
  styleUrls: ['./risk-tile.component.scss']
})
export class RiskTileComponent implements OnInit{
  InsightStatus = HealthStatus;
  title:string = "";
  @Input() risk:Risk;
  constructor(private telemetryService:TelemetryService,private portalService:PortalActionService) { }


  ngOnInit(){
    this.title = this.risk.title;
  }

  clickTileHandler(){
    this.telemetryService.logEvent("RiskTileClicked",{});
    this.risk.action();
  }

}

export interface Risk {
  title: string;
  action: () => void
}
