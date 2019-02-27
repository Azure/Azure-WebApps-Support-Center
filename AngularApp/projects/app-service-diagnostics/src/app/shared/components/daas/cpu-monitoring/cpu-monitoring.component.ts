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

  titles:string[] = ['1. Configure CPU Monitoring Rule','2. View CPU Monitoring Rule Activity', '3. Check CPU Monitoring Session Data'];
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
