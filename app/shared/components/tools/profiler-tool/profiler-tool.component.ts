import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Session } from '../../../models/daas';
import { SiteService, DaasService, WindowService, AvailabilityLoggingService } from '../../../services';
import { SiteInfoMetaData } from '../../../models/site';

@Component({
    templateUrl: 'profiler-tool.component.html',
    styleUrls: ['../styles/daasstyles.css']
})
export class ProfilerToolComponent implements OnInit {

    title: string = "Collect a Profiler Trace";
    description: string = "If your app is down or performing slow, you can collect a profiling trace to identify the root cause of the issue. Profiling is light weight and is designed for production scenarios.";

    thingsToKnowBefore: string[] = [
        "Once the profiler trace is started, reproduce the issue by browsing to the web app",
        "The profiler trace will automatically stop after 60 seconds.",
        "Your web app will not be restarted as a result of running the profiler.",
        "A profiler trace will help to identify issues in an ASP.NET application only and ASP.NET core is not yet supported",
    ]

    siteToBeProfiled: SiteDaasInfo    
    scmPath: string;
    couldNotFindSite: boolean = false;

    Sessions: Session[];
    checkingExistingSessions: boolean;

    constructor(private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService) {

        this._siteService.currentSiteMetaData.subscribe(siteInfo => {
            if (siteInfo) {
                
                let siteInfoMetaData = siteInfo;
                this.siteToBeProfiled = new SiteDaasInfo();
                
                this.siteToBeProfiled.subscriptionId = siteInfo.subscriptionId;
                this.siteToBeProfiled.resourceGroupName =siteInfo.resourceGroupName;
                this.siteToBeProfiled.siteName = siteInfo.siteName;
                this.siteToBeProfiled.slot =siteInfo.slot;
                this.siteToBeProfiled.instances = [];

            }
        });
    }

    ngOnInit(): void {

        this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
    }

    updateCheckingExistingSessions(event) {
        this.checkingExistingSessions = event;
    }

    updateSessions(event) {
        this.Sessions = event;
    }
}