import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { SiteDaasInfo } from '../../../../shared/models/solution-metadata';
import { Subscription } from 'rxjs';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { Diagnoser, DiagnoserStatusMessage, Session, Report } from '../../../../shared/models/daas';
import { StepWizardSingleStep } from '../../../../shared/models/step-wizard-single-step';
import { StepWizardComponent } from '../../../../shared/components/step-wizard/step-wizard.component';
import { DaasSessionsComponent } from '../../../../shared/components/daas-sessions/daas-sessions.component';
import { SiteService } from '../../../../shared/services/site.service';
import { DaasService } from '../../../../shared/services/daas.service';
import { WindowService } from '../../../../shared/services/window.service';
import { AvailabilityLoggingService } from '../../../../shared/services/logging/availability.logging.service';
import { ServerFarmDataService } from '../../../../shared/services/server-farm-data.service';
import { Observable } from 'rxjs/Observable';

@Component({
    templateUrl: 'profiling-solution.component.html',
    styleUrls: ['../../../styles/solutions.css',
        'profiling-solution.component.css'
    ]
})
export class ProfilingSolutionComponent implements SolutionBaseComponent, OnInit {

    @Input() data: SolutionData;

    title: string = "Collect a Profiler Trace";
    description: string = "If your app is down or performing slow, you can collect a profiling trace to identify the root cause of the issue. Profiling is light weight and is designed for production scenarios.";

    thingsToKnowBefore: string[] = [
        "Once the profiler trace is started, reproduce the issue by browsing to the web app",
        "The profiler trace will automatically stop after 60 seconds.",
        "If thread report option is enabled, then raw stack traces of threads inside the process will be collected as well.",
        "With thread report option, your App may be paused for a few seconds till all the threads are dumped.",         
        "Your web app will not be restarted as a result of running the profiler.",
        "A profiler trace will help to identify issues in an ASP.NET application only and ASP.NET core is not yet supported",
    ]

    siteToBeProfiled: SiteDaasInfo;
    scmPath: string;
    couldNotFindSite: boolean = false;
    refreshSessions:boolean = false;

    constructor(private _siteService: SiteService, private _logger: AvailabilityLoggingService, private _serverFarmService: ServerFarmDataService) {
    }

    ngOnInit(): void {

        this._logger.LogSolutionDisplayed('CLR Profiling', this.data.solution.order.toString(), 'bot-sitecpuanalysis');
        let siteInfo = MetaDataHelper.getSiteDaasData(this.data.solution.data);

        this._serverFarmService.sitesInServerFarm.subscribe(sites => {
            if (sites) {
                let targetedSite = sites.find(site => site.name.toLowerCase() === siteInfo.siteName.toLowerCase());

                if (targetedSite) {
                    let siteName = targetedSite.name;
                    let slotName = '';
                    if (targetedSite.name.indexOf('(') >= 0) {
                        let parts = targetedSite.name.split('(');
                        siteName = parts[0];
                        slotName = parts[1].replace(')', '');
                    }

                    this.siteToBeProfiled = <SiteDaasInfo>{
                        subscriptionId: siteInfo.subscriptionId,
                        resourceGroupName: targetedSite.resourceGroup,
                        siteName: siteName,
                        slot: slotName
                    }

                    this.scmPath = targetedSite.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);

                }
                else {
                    this.couldNotFindSite = true;
                }
            }

        });
    }

    updateSessions(event) {
        this.refreshSessions = event;
    }
}