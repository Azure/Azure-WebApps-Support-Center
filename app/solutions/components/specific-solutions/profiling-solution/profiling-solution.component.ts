import { Component, Input, OnInit } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { PortalActionService, SiteService, ServerFarmDataService } from '../../../../shared/services'
import { SiteProfilingInfo } from '../../../../shared/models/solution-metadata';


@Component({
    templateUrl: 'profiling-solution.component.html',
    styleUrls: ['../../../styles/solutions.css',
        'profiling-solution.component.css'
    ]
})
export class ProfilingComponent implements SolutionBaseComponent, OnInit {

    @Input() data: SolutionData;

    title: string = "Collect a Profiler Trace";
    description: string = "If your app is down or performing slow, you can collect a profiling trace to identify the root cause of the issue. Profiling is light weight and is designed for production scenarios.";

    thingsToKnowBefore: string[] = [
        "Once the profiler trace is started, you should reproduce the issue by browsing to the WebApp",
        "The profiler trace will automatically stop after 60 seconds.",        
        "Your application will not be restarted as a result of running the profiler.",
        "A profiler trace will help to identify issues in an ASP.NET application only and ASP.NET core is not yet supported",
    ]

    siteToBeProfiled: SiteProfilingInfo;
    instanceList: string;

    constructor(private _siteService: SiteService, _portalActionService: PortalActionService, _serverFarmService: ServerFarmDataService) {

    }

    ngOnInit(): void {
        this.siteToBeProfiled = MetaDataHelper.getProfilingData(this.data.solution.data);
        this.instanceList = "";
    }

    collectProfilerTrace() {
        //TODO: logging
        //this._siteService.restartSite(this.siteToBeProfiled.subscriptionId, this.siteToBeProfiled.resourceGroupName, this.siteToBeProfiled.siteName).subscribe(result => {
            console.log("Start Profiler Trace here !");
     //   });
    }

   
}