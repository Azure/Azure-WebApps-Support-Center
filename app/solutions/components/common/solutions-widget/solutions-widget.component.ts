import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { SolutionUIModelBase } from '../../../../shared/models/solution-ui-model/solution-ui-model-base';
import { SolutionMetadata } from '../../../../shared/models/solution-ui-model/solutionproperties';
import { PortalActionService, AvailabilityLoggingService, WindowService, SolutionFactoryService } from '../../../../shared/services';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { SolutionFactory } from '../../../../shared/models/solution-ui-model/solutionfactory';
import { SolutionHolder } from '../../../../shared/models/solution-holder';
import {  } from '../../../../shared/services/solution-factory.service';
import { ISolution } from '../../../../shared/models/solution';


@Component({
    selector: 'solutions-widget',
    templateUrl: 'solutions-widget.component.html'
})
export class SolutionsWidgetComponent implements OnInit {

    private _solutionModelSubject: ReplaySubject<SolutionUIModelBase[]> = new ReplaySubject<SolutionUIModelBase[]>(1);

    constructor(private _solutionFactoryService: SolutionFactoryService) {

    }

    @Input() set solutionModel(model: SolutionUIModelBase[]) {
        this._solutionModelSubject.next(model);
    };

    solutions: SolutionHolder[] = [];

    ngOnInit(): void {
        let sampleRestart = <ISolution>{ "id": 1.0, "displayName": "Kill Process(es) on Instance", "order": 1.0, "description": "This action will only kill a specific process on specified instances. Other processes are not affected and the whole site is not restarted.", "data": [[{ "name": "SubscriptionId", "value": "ef90e930-9d7f-4a60-8a99-748e0eea69de" }, { "name": "ResourceGroup", "value": "build2015demorg" }, { "name": "SiteName", "value": "buggybakery" }, { "name": "ProcessName", "value": "buggybakery" }, { "name": "MachineName", "value": "RD00155D3BFE27" }, { "name": "InstanceId", "value": "23975d61d45f1de4d5980442c107a28d6438e0ac0f28a1eb70c5f89025990aac" }], [{ "name": "SubscriptionId", "value": "ef90e930-9d7f-4a60-8a99-748e0eea69de" }, { "name": "ResourceGroup", "value": "build2015demorg" }, { "name": "SiteName", "value": "buggybakery" }, { "name": "ProcessName", "value": "buggybakery" }, { "name": "MachineName", "value": "RD00155D3BEAA4" }, { "name": "InstanceId", "value": "177d406f6116588e488f229322e0d416f7026376e4e4d991b40ce5085affb0fe" }], [{ "name": "SubscriptionId", "value": "ef90e930-9d7f-4a60-8a99-748e0eea69de" }, { "name": "ResourceGroup", "value": "build2015demorg" }, { "name": "SiteName", "value": "buggybakery" }, { "name": "ProcessName", "value": "buggybakery" }, { "name": "MachineName", "value": "RD00155D3C2142" }, { "name": "InstanceId", "value": "bae4a5f918cf044087f6b73d3e3ee0cecd6caaef4f0d85a2471cbaa2574cd8c8" }]], "metadata": [] }

        let sampleProfiler = <ISolution>{ "id": 104, "displayName": "Kill Process(es) on Instance", "order": 1.0, "description": "This action will only kill a specific process on specified instances. Other processes are not affected and the whole site is not restarted.", "data": [[{ "name": "SubscriptionId", "value": "1402be24-4f35-4ab7-a212-2cd496ebdf14" }, { "name": "ResourceGroup", "value": "clrprofiling" }, { "name": "SiteName", "value": "clrprofiling" }, { "name": "ProcessName", "value": "clrprofiling" }, { "name": "MachineName", "value": "RD00155D3BFE27" }, { "name": "InstanceId", "value": "23975d61d45f1de4d5980442c107a28d6438e0ac0f28a1eb70c5f89025990aac" }], [{ "name": "SubscriptionId", "value": "ef90e930-9d7f-4a60-8a99-748e0eea69de" }, { "name": "ResourceGroup", "value": "clrprofiling" }, { "name": "SiteName", "value": "clrprofiling" }, { "name": "ProcessName", "value": "clrprofiling" }, { "name": "MachineName", "value": "RD00155D3BEAA4" }, { "name": "InstanceId", "value": "177d406f6116588e488f229322e0d416f7026376e4e4d991b40ce5085affb0fe" }], [{ "name": "SubscriptionId", "value": "1402be24-4f35-4ab7-a212-2cd496ebdf14" }, { "name": "ResourceGroup", "value": "clrprofiling" }, { "name": "SiteName", "value": "clrprofiling" }, { "name": "ProcessName", "value": "clrprofiling" }, { "name": "MachineName", "value": "RD00155D3C2142" }, { "name": "InstanceId", "value": "bae4a5f918cf044087f6b73d3e3ee0cecd6caaef4f0d85a2471cbaa2574cd8c8" }]], "metadata": [] }
        let s = this._solutionFactoryService.getSolutionById(sampleRestart);
        let t = this._solutionFactoryService.getSolutionById(<ISolution>{ id: 3 });
        let p = this._solutionFactoryService.getSolutionById(sampleProfiler);
        
        this.solutions.push(s);
        this.solutions.push(t);
        this.solutions.push(p);
     
        
    }
}