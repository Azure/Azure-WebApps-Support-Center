import { Component, OnInit } from '@angular/core';
import { MonitoringSession } from '../../models/daas';
import { DaasService } from '../../services/daas.service';
import { SiteDaasInfo } from '../../models/solution-metadata';
import { SiteService } from '../../services/site.service';
import { WindowService } from '../../../startup/services/window.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'monitoring-sessions',
  templateUrl: './monitoring-sessions.component.html',
  styleUrls: ['./monitoring-sessions.component.scss' ]
})
export class MonitoringSessionsComponent implements OnInit {

  title: string = 'CPU monitoring sessions';
  monitoringSessions: MonitoringSession[] = [];
  siteToBeDiagnosed: SiteDaasInfo;
  scmPath: string;
  subscription: Subscription;
  description: string = "The below table shows you all the CPU monitoring sessions submitted in the past for this app";

  constructor(private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService) {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
    });
  }

  ngOnInit() {
    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
    this.getMonitoringSessions();
    this.subscription = interval(30000).subscribe(res => {
      this.getMonitoringSessions();
    });
  }

  getMonitoringSessions() {
    this._daasService.getAllMonitoringSessions(this.siteToBeDiagnosed).subscribe(resp => {
      this.monitoringSessions = resp;
    });
  }

  openReport(url: string) {
    this._windowService.open(`https://${this.scmPath}/api/vfs/${url}`);
  }

  getfileNameFromPath(path: string): string {
    let reportNameArray = path.split('/');
    if (reportNameArray.length > 0) {
      return reportNameArray[reportNameArray.length - 1];
    } else {
      return path;
    }
  }

  analyzeSession(sessionId: string) {
    this._daasService.analyzeMonitoringSession(this.siteToBeDiagnosed, sessionId).subscribe(resp => {
      if (resp) {
        this.getSession(sessionId);
      }
    });

  }

  getSession(sessionId: string) {
  }
}
