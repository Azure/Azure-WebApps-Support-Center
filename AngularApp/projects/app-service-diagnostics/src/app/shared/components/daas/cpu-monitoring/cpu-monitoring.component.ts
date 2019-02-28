import { Component, OnInit, Input } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';
import { MonitoringSession } from '../../../models/daas';

@Component({
  selector: 'cpu-monitoring',
  templateUrl: './cpu-monitoring.component.html',
  styleUrls: ['./cpu-monitoring.component.scss']
})
export class CpuMonitoringComponent implements OnInit {

  @Input() public siteToBeDiagnosed: SiteDaasInfo;
  @Input() public scmPath: string;

  daasValidated: boolean = false;
  monitoringInProgress:boolean  = false;
  activeSession:MonitoringSession;

  titles:string[] = ['1. Configure','2. Observe', '3. Analyze'];
  constructor(private _siteService: SiteService) {

    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
    });
  }

  onDaasValidated(validated: boolean) {
    if (validated){
      this.daasValidated = true;
    }
    
  }

  ngOnInit(): void {
  }

  updateMonitoringStatus(status:boolean){
    this.monitoringInProgress = status;
  }

  updateActiveSession(activeSession:MonitoringSession){
    this.activeSession = activeSession;
  }

}
