import { Component, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';

@Component({
  selector: 'cpu-monitoring-tool',
  templateUrl: './cpu-monitoring-tool.component.html',
  styleUrls: ['./cpu-monitoring-tool.component.scss', '../styles/daasstyles.scss']
})
export class CpuMonitoringToolComponent implements OnInit {

  siteToBeDiagnosed: SiteDaasInfo;
  scmPath: string;

  title: string = 'Proactive CPU Monitoring';
  description: string = 'If your app is consuming high CPU, you can enable this feature to collect memory dumps when the app takes high CPU resources and decide whether to kill the process or not';
  allSessions: string = '../cpumonitoringsessions';

  constructor(private _siteService: SiteService) {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
    });
  }

  ngOnInit(){
    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
  }

}
