import { Component, OnInit, Input } from '@angular/core';
import { MonitoringSession } from '../../../../models/daas';
import { SiteDaasInfo } from '../../../../models/solution-metadata';
import { Subscription, interval } from 'rxjs';
import { SiteService } from '../../../../services/site.service';
import { DaasService } from '../../../../services/daas.service';
import { WindowService } from 'projects/app-service-diagnostics/src/app/startup/services/window.service';

@Component({
  selector: 'cpu-monitoring-sessions',
  templateUrl: './cpu-monitoring-sessions.component.html',
  styleUrls: ['./cpu-monitoring-sessions.component.scss']
})
export class CpuMonitoringSessionsComponent implements OnInit {

  monitoringSessions: MonitoringSession[] = [];
  siteToBeDiagnosed: SiteDaasInfo;
  scmPath: string;
  subscription: Subscription;
  description: string = "The below table shows you all the CPU monitoring rules for this app. To save disk space, older sessions are automatically deleted.";
  gettingSessions:boolean = true;

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
      resp = resp.sort(function (a, b) {
        return Number(new Date(b.StartDate)) - Number(new Date(a.StartDate));
      });

      this._daasService.getActiveMonitoringSessionDetails(this.siteToBeDiagnosed).subscribe(activeSession => {
        this.monitoringSessions = resp;
        this.gettingSessions = false;
        if (activeSession && activeSession.Session) {
          this.monitoringSessions.unshift(activeSession.Session);
        }
      });
    });
  }

  openReport(url: string) {
    this._windowService.open(`https://${this.scmPath}/api/vfs/${url}`);
  }

  getfileNameFromPath(path: string): string {
    let reportNameArray = path.split('/');
    if (reportNameArray.length > 0) {

      let shortName = reportNameArray[reportNameArray.length - 1];

      let friendlyNameArray = shortName.split('_');
      if (friendlyNameArray.length > 2) {
        return friendlyNameArray[0] + "_" + friendlyNameArray[1] + "_" + friendlyNameArray[2];
      } else {
        return shortName;
      }
    } else {
      return path;
    }
  }

  analyzeSession(session: MonitoringSession) {
    session.AnalysisSubmitted = true;
    this._daasService.analyzeMonitoringSession(this.siteToBeDiagnosed, session.SessionId).subscribe(resp => {
      if (resp) {
        this.getSession(session.SessionId);
      }
    });

  }

  formatStartDate(session:MonitoringSession): string {
    var date = new Date(session.StartDate);
    let formattedDate = (date.getUTCMonth() + 1).toString().padStart(2, '0') + '/' + date.getUTCDate().toString().padStart(2, '0') + '/' + date.getUTCFullYear().toString() + ' ' + (date.getUTCHours() < 10 ? '0' : '') + date.getUTCHours()
      + ':' + (date.getUTCMinutes() < 10 ? '0' : '') + date.getUTCMinutes() + ' UTC';
    const utc = new Date().toUTCString();

    if (this.isSessionActive(session)){
      formattedDate += "<br/>" + this.getDuration(session.StartDate, utc) + ' ago';
    }
    
    return formattedDate;
  }

  getDuration(start: string, end: string): string {
    let startDate = new Date(start);
    let endDate = new Date(end);
    let endDateTime = new Date(endDate).getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const duration = endDateTime.valueOf() - startDate.valueOf();
    const inDays = Math.round(duration / oneDay);
    const inHours = Math.round(duration * 24 / oneDay);
    const inMinutes = Math.round(duration * 24 * 60 / oneDay);
    let durationString = (inDays > 0 ? inDays.toString() + ' day(s)' : (inHours > 0 ? inHours.toString() + ' hour(s)' : inMinutes.toString() + ' minute(s)'));
    return durationString;
  }

  isSessionActive(session: MonitoringSession): boolean {
    return session.StartDate > session.EndDate;;
  }

  getSession(sessionId: string) {
  }

}
