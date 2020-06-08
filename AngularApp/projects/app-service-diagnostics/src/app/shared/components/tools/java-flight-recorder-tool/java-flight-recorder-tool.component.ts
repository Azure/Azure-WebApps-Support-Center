import { Component, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from 'projects/app-service-diagnostics/src/app/startup/services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';

@Component({
  selector: 'java-flight-recorder-tool',
  templateUrl: './java-flight-recorder-tool.component.html',
  styleUrls: ['../styles/daasstyles.scss']
})
export class JavaFlightRecorderToolComponent implements OnInit {

  title: string = 'Collect a JAVA Flight Recorder Trace';
  description: string = 'If your app is down or performing slow, you can collect a JFR trace to identify the root cause of the issue.';
  siteToBeDiagnosed: SiteDaasInfo;
  scmPath: string;
  couldNotFindSite: boolean = false;

  refreshSessions: boolean = false;

  constructor(private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService) {

    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
    });
  }

  ngOnInit(): void {

    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
  }

  updateSessions(event) {
    this.refreshSessions = event;
  }

}
