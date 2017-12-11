import { Component, Input, OnInit } from '@angular/core';
import { Session } from '../../models/daas';

@Component({
    selector: 'daas-sessions',
    templateUrl: 'daas-sessions.component.html',
    styleUrls: ['daas-sessions.component.css']
})

export class DaasSessionsComponent {

    @Input() public checkingExistingSessions: boolean;
    @Input() public Sessions: Session[];
    @Input() public SessionType: string;

    DiagnoserHeading:string;

    ngOnInit(): void {

        if (this.SessionType === "CLR Profiler")
        {
            this.DiagnoserHeading = "Profiling sessions";
        }
        else if (this.SessionType === "Memory Dump")
        {
            this.DiagnoserHeading = "Dumps collected";
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
}