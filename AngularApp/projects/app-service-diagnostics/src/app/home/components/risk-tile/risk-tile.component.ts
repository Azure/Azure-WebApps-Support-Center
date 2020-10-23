import { Component, Input } from '@angular/core';
import { HealthStatus, TelemetryService } from 'diagnostic-data'
import { PortalActionService } from '../../../shared/services/portal-action.service';
@Component({
  selector: 'risk-tile',
  templateUrl: './risk-tile.component.html',
  styleUrls: ['./risk-tile.component.scss']
})
export class RiskTileComponent {
  InsightStatus = HealthStatus;
  @Input() categoryId:string;
  @Input() tileTitle:string;

  constructor(private telemetryService:TelemetryService,private portalService:PortalActionService) { }

  clickTileHandler(){
    const props = {};
    props["CategoryId"] = this.categoryId;
    this.telemetryService.logEvent("RiskTileClicked",props);
    this.portalService.openBladeDiagnoseCategoryBlade(this.categoryId);
  }

}
