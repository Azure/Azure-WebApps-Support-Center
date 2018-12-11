import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { SiteDaasInfo } from '../../../../shared/models/solution-metadata';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { SiteService } from '../../../../shared/services/site.service';
import { AvailabilityLoggingService } from '../../../../shared/services/logging/availability.logging.service';
import { ServerFarmDataService } from '../../../../shared/services/server-farm-data.service';

class InstanceSelection {
    InstanceName: string;
    Selected: boolean;
}

@Component({
    templateUrl: 'java-threaddump-solution.component.html',
    styleUrls: ['../../../styles/solutions.scss'        
    ]
})
export class JavaThreadDumpSolutionComponent implements SolutionBaseComponent, OnInit {

    @Input() data: SolutionData;

    title: string = "Collect a Java Thread dump";
    description: string = "If your Java app is performing slow or not responding at all, you can collect a jStack log to identify the state of threads running the java.exe";
    
    thingsToKnowBefore: string[] = [
        "Collecting a jStack log will freeze the process until the jStack log is collected so process cannot serve any requests during the time jStack is running.",
        "jStack logs are collected for all the Java process (java.exe) running on the instance.",
        "jStack takes a few seconds to run but if there are many threads, it can take slightly longer to collect this data.",
        "Your App will not be restarted as a result of collecting the jStack logs."
    ]

    siteToBeDiagnosed: SiteDaasInfo;
    scmPath: string;
    couldNotFindSite: boolean = false;

    diagnoserName: string = "JAVA Thread Dump";
    refreshSessions: boolean = false;

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