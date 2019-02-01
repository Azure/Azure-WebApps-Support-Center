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

  title: string = 'Auto-Collect on High CPU';
  description: string = 'If your app is consuming high CPU, you can enable this feature to collect memory dumps when the app takes high CPU resources and decide whether to kill the process or not';
  allSessions: string = '../cpumonitoringsessions';

  thingsToKnowBefore: string[] = [
    'When the dump is being generated, the process will be paused for a few seconds till the dump generation finishes.',
    'The size of the dump captured is directly proportional to the amount of memory consumed by the application process.',
    'Monitoring is enabled on the worker process (w3wp.exe) and all child processes spun by the worker process.',
    
  ];

  constructor(private _siteService: SiteService) {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
    });
  }

  ngOnInit(){
    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
  }

}
