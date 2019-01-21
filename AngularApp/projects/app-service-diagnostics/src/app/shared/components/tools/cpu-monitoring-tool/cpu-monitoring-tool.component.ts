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

  title: string = 'Enable CPU monitoring';
  description: string = 'If your app is consuming HIGH CPU, you can enable CPU monitoring that allows you to collect data when the app takes high CPU resources and allows you to kill the process';
  allSessions: string = '../cpumonitoringsessions';

  thingsToKnowBefore: string[] = [
    'CPU monitoring is light weight and adds 0.02 % CPU overhead per process monitored',
    'Monitoring is enabled on the worker process (w3wp) and all child processes spun by the worker process',
    'When the configured CPU threshold is reached, a memory dump will be triggered. ',
    'When the dump is being generated, the process will be paused for a few seconds till the dump generation finishes.',
    'The size of the dump captured is directly proportional to the amount of memory consumed by the application process',
    'If required, you can configure the monitoring to terminate the process once the dump is generated'
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
