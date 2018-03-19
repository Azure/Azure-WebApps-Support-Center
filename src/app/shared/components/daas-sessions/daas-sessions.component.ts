import { Component, Input, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { Session } from '../../models/daas';
import { WindowService } from '../../services/window.service';
import { ServerFarmDataService } from '../../services/server-farm-data.service';
import { DaasService } from '../../services/daas.service';
import { SiteDaasInfo } from '../../models/solution-metadata';

@Component({
    selector: 'daas-sessions',
    templateUrl: 'daas-sessions.component.html',
    styleUrls: ['daas-sessions.component.css']
})

export class DaasSessionsComponent implements OnChanges {

    checkingExistingSessions: boolean;
    Sessions: Session[];
    
    @Input() public DiagnoserNameLookup: string;
    @Input() public siteToBeDiagnosed: SiteDaasInfo;
    @Input() public scmPath: string;

    DiagnoserHeading: string;
    supportedTier: boolean = false;
    
    @Input() refreshSessions:boolean = false;

    constructor(private _windowService: WindowService, private _serverFarmService: ServerFarmDataService, private _daasService: DaasService) {
        this._serverFarmService.siteServerFarm.subscribe(serverFarm => {
            if (serverFarm) {
                if (serverFarm.sku.tier === "Standard" || serverFarm.sku.tier === "Basic" || serverFarm.sku.tier === "Premium") {
                    this.supportedTier = true;
                }
            }
        }, error => {
            //TODO: handle error
        })

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['refreshSessions']) {
            this.populateSessions();
        }
      }

    ngOnInit(): void {

        this.populateSessions();
    }

    populateSessions()
    {
        if (this.DiagnoserNameLookup.startsWith("CLR Profiler")) {
            this.DiagnoserHeading = "profiling sessions";
        }
        else if (this.DiagnoserNameLookup === "Memory Dump") {
            this.DiagnoserHeading = "dumps collected";
        }
        else {
            this.DiagnoserHeading = "diagnostic sessions";
        }

        this.checkingExistingSessions = true;
        this._daasService.getDaasSessionsWithDetails(this.siteToBeDiagnosed).retry(2)
            .subscribe(sessions => {
                this.checkingExistingSessions = false;
                this.Sessions = this.takeTopFiveDiagnoserSessions(sessions);
            });
    }

    takeTopFiveDiagnoserSessions(sessions: Session[]): Session[] {
        var arrayToReturn = new Array<Session>();
        sessions.forEach(session => {
            session.DiagnoserSessions.forEach(diagnoser => {
                if (diagnoser.Name.startsWith(this.DiagnoserNameLookup)) {
                    arrayToReturn.push(session);
                }
            });
        });

        if (arrayToReturn.length > 5) {
            arrayToReturn = arrayToReturn.slice(0, 5);
        }
        return arrayToReturn;
    }

    getInstanceNameFromReport(reportName: string): string {

        if (!this.DiagnoserNameLookup.startsWith("CLR Profiler")) {
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