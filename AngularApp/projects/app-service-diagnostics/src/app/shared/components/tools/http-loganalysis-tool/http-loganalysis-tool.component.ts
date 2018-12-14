import { Component, Input, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Session } from '../../../models/daas';
import { SiteInfoMetaData } from '../../../models/site';
import { DaasBaseComponent } from '../daas-base/daas-base.component';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from '../../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';

@Component({
    templateUrl: 'http-loganalysis-tool.component.html',
    styleUrls: ['../styles/daasstyles.scss']
})
export class HttpLogAnalysisToolComponent extends DaasBaseComponent implements OnInit {

    title: string = 'Collect and Analyzes HTTP logs';
    description: string = 'If your Web App is experiencing heavy traffic, you can run this tool to identify slowest requests, client IP addresses and HTTP status codes returned by the App.';

    thingsToKnowBefore: string[] = [
        'This tool parses HTTP logs persisted to File-System and HTTP Logging must be enabled for this tool to work.',
        'Analyzing IIS logs is a CPU-intensive operation, so you should run it only if the App has enough CPU resources.',
        'Your App will not be restarted as a result of collecting and analyzing IIS logs.',
        'HTTP Log Analysis uses the LogParser tool to analyze IIS logs.'

    ];

    constructor(private _siteServiceLocal: SiteService, private _daasServiceLocal: DaasService, private _windowServiceLocal: WindowService, private _loggerLocal: AvailabilityLoggingService) {
        super(_siteServiceLocal, _daasServiceLocal, _windowServiceLocal, _loggerLocal);
    }
    ngOnInit(): void {

        this.diagnoserName = 'Http Logs';
        this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);

    }


}
