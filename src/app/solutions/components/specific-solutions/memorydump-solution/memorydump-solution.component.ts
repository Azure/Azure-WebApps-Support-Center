import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { SiteDaasInfo } from '../../../../shared/models/solution-metadata';
import { Subscription } from 'rxjs';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { Observable } from 'rxjs/Observable';
import { Diagnoser, DiagnoserStatusMessage, Session, Report } from '../../../../shared/models/daas';
import { StepWizardSingleStep } from '../../../../shared/models/step-wizard-single-step';
import { StepWizardComponent } from '../../../../shared/components/step-wizard/step-wizard.component';
import { DaasSessionsComponent } from '../../../../shared/components/daas-sessions/daas-sessions.component';
import { SiteService } from '../../../../shared/services/site.service';
import { DaasService } from '../../../../shared/services/daas.service';
import { WindowService } from '../../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../../../shared/services/logging/availability.logging.service';
import { ServerFarmDataService } from '../../../../shared/services/server-farm-data.service';

class InstanceSelection {
    InstanceName: string;
    Selected: boolean;
}

@Component({
    templateUrl: 'memorydump-solution.component.html',
    styleUrls: ['../../../styles/solutions.css',
        'memorydump-solution.component.css'
    ]
})
export class MemoryDumpSolutionComponent implements SolutionBaseComponent, OnInit {

    @Input() data: SolutionData;

    title: string = "Collect a Memory dump";
    description: string = "If your app is performing slow or not responding at all, you can collect a memory dump to identify the root cause of the issue.";

    thingsToKnowBefore: string[] = [
        "Collecting a memory dump freezes process until dump generation finishes so process cannot serve any requests during this time.",
        "Dumps are collected for the worker process (w3wp.exe) and child processes of the worker process.",
        "Size of the memory dump is directly proportional to the process size, so processes consuming more memory will take longer to be dumped.",
        "Your App will not be restarted as a result of collecting the memory dump."
    ]

    siteToBeDiagnosed: SiteDaasInfo;
    scmPath: string;
    couldNotFindSite: boolean = false;

    refreshSessions:boolean = false;
    diagnoserName: string = "Memory Dump";

    constructor(private _siteService: SiteService, private _logger: AvailabilityLoggingService, private _serverFarmService: ServerFarmDataService) {
    }

    ngOnInit(): void {

        this._logger.LogSolutionDisplayed(this.diagnoserName, this.data.solution.order.toString(), 'bot-sitecpuanalysis');
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

                    this.siteToBeDiagnosed = <SiteDaasInfo>{
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