import { Component, Input, OnInit } from '@angular/core';
import { Session } from '../../models/daas';
import { WindowService } from '../../services/index';

@Component({
    selector: 'daas-sessions',
    templateUrl: 'daas-sessions.component.html',
    styleUrls: ['daas-sessions.component.css']
})

export class DaasSessionsComponent {

    @Input() public checkingExistingSessions: boolean;
    @Input() public Sessions: Session[];
    @Input() public SessionType: string;

    @Input() public scmPath: string;

    DiagnoserHeading:string;

    constructor(private _windowService: WindowService) {
        
    }

    ngOnInit(): void {

        if (this.SessionType === "CLR Profiler")
        {
            this.DiagnoserHeading = "profiling sessions";
        }
        else if (this.SessionType === "Memory Dump")
        {
            this.DiagnoserHeading = "dumps collected";
        }
        else
        {
            this.DiagnoserHeading = "diagnostic sessions";
        }
    }

    getInstanceNameFromReport(reportName: string): string {

        if (this.SessionType !="CLR Profiler")
        {
            return reportName;
        }

        var reportNameArray = reportName.split("_");
        if (reportNameArray.length > 0) {
            return reportNameArray[0];
        }
        else {
            return reportName;
        }
    }

    openReport(url: string) {
        this._windowService.open(`https://${this.scmPath}/api/vfs/data/DaaS/${url}`);
    }
}