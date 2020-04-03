import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Session } from '../../../models/daas';
import { SiteInfoMetaData } from '../../../models/site';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from '../../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';

@Component({
    templateUrl: 'profiler-tool.component.html',
    styleUrls: ['../styles/daasstyles.scss']
})
export class ProfilerToolComponent implements OnInit{

    title: string = 'Collect a Profiler Trace';
    description: string = 'If your app is down or performing slow, you can collect a profiling trace to identify the root cause of the issue. Profiling is light weight and is designed for production scenarios.';

    thingsToKnowBefore: string[] = [
        'Once the profiler trace is started, reproduce the issue by browsing to the web app.',
        'The profiler trace will automatically stop after 60 seconds.',
        'If thread report option is enabled, then raw stack traces of threads inside the process will be collected as well.',
        'With thread report option, your App may be paused for a few seconds till all the threads are dumped.',
        'Your web app will not be restarted as a result of running the profiler.',
        'A profiler trace will help to identify issues in an ASP.NET or ASP.NET Core application.',
    ];

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
