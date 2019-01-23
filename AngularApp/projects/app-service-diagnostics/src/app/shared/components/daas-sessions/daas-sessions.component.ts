import { Component, Input, OnInit, SimpleChanges, OnChanges, Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Session, SessionStatus } from '../../models/daas';
import { WindowService } from '../../../startup/services/window.service';
import { ServerFarmDataService } from '../../services/server-farm-data.service';
import { DaasService } from '../../services/daas.service';
import { SiteDaasInfo } from '../../models/solution-metadata';
import { Subscription, Observable, interval } from 'rxjs';
import { retry } from 'rxjs/operators';
import { FormatHelper } from '../../utilities/formattingHelper';

@Component({
    selector: 'daas-sessions',
    templateUrl: 'daas-sessions.component.html',
    styleUrls: ['daas-sessions.component.scss']
})

export class DaasSessionsComponent implements OnChanges, OnDestroy {

    checkingExistingSessions: boolean;
    sessions: Session[];

    @Input() public diagnoserNameLookup: string = '';
    @Input() public siteToBeDiagnosed: SiteDaasInfo;
    @Input() public scmPath: string;
    @Input() public showDetailsLink: boolean = true;

    DiagnoserHeading: string;
    supportedTier: boolean = false;

    @Input() refreshSessions: boolean = false;
    showDetailedView: boolean = false;
    allSessions: string = '../../diagnosticTools';
    subscription: Subscription;


    constructor(private _windowService: WindowService, private _serverFarmService: ServerFarmDataService, private _daasService: DaasService) {
        this._serverFarmService.siteServerFarm.subscribe(serverFarm => {
            if (serverFarm) {
                if (serverFarm.sku.tier === 'Standard' || serverFarm.sku.tier === 'Basic' || serverFarm.sku.tier.indexOf('Premium') > -1) {
                    this.supportedTier = true;
                }
            }
        }, error => {
            //TODO: handle error
        });

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['refreshSessions']) {
            this.populateSessions();
        }
    }

    ngOnInit(): void {

        if (this.diagnoserNameLookup === '') {
            this.showDetailedView = true;
        }

        if (this.showDetailedView) {
            this.populateSessions();
            if (this.showDetailedView) {
                this.subscription = interval(15000).subscribe(res => {
                    this.checkSessions();
                });
            }
        }
    }

    reducedSession(obj: Session) {
        return { SessionId: obj.SessionId, DiagnoserSessions: obj.DiagnoserSessions, Status: obj.Status };
    }

    checkSessions() {
        this._daasService.getDaasSessionsWithDetails(this.siteToBeDiagnosed).pipe(retry(2))
            .subscribe(sessions => {
                const newSessions = sessions.map(this.reducedSession);
                const existingSessions = this.sessions.map(this.reducedSession);

                if (newSessions.length === existingSessions.length && newSessions.filter(newSession => existingSessions.findIndex(session => session === newSession) === -1).length > 0) {
                    this.sessions = this.setExpanded(sessions);
                }
            });
    }

    populateSessions() {
        if (this.diagnoserNameLookup.startsWith('CLR Profiler')) {
            this.DiagnoserHeading = 'profiling sessions';
        } else if (this.diagnoserNameLookup === 'Memory Dump') {
            this.DiagnoserHeading = 'dumps collected';
        } else {
            this.DiagnoserHeading = 'diagnostic sessions';
        }

        this.checkingExistingSessions = true;
        this._daasService.getDaasSessionsWithDetails(this.siteToBeDiagnosed).pipe(retry(2))
            .subscribe(sessions => {
                this.checkingExistingSessions = false;
                if (this.showDetailedView) {
                    this.sessions = this.setExpanded(sessions);
                } else {
                    this.sessions = this.takeTopFiveDiagnoserSessions(sessions);
                }

            });
    }

    takeTopFiveDiagnoserSessions(sessions: Session[]): Session[] {
        let arrayToReturn = new Array<Session>();
        sessions.forEach(session => {
            session.DiagnoserSessions.forEach(diagnoser => {
                if (diagnoser.Name.startsWith(this.diagnoserNameLookup)) {
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

        if (!this.diagnoserNameLookup.startsWith('CLR Profiler')) {
            return reportName;
        }

        const reportNameArray = reportName.split('_');
        if (reportNameArray.length > 0) {
            return reportNameArray[0];
        } else {
            return reportName;
        }
    }

    openReport(url: string) {
        this._windowService.open(`https://${this.scmPath}/api/vfs/data/DaaS/${url}`);
    }

    toggleExpanded(i: number): void {
        this.sessions[i].Expanded = !this.sessions[i].Expanded;
    }

    hasErrors(session: Session): boolean {
        return session.Status == SessionStatus.Error;
    }

    isSessionInProgress(session: Session): boolean {
        return session.Status == SessionStatus.Active;
    }

    setExpanded(sessions: Session[]): Session[] {
        const maxValue = (sessions.length > 3 ? 3 : sessions.length);
        let counter = 0;
        while (counter < maxValue) {
            sessions[counter].Expanded = true;
            counter++;
        }
        return sessions;
    }

    deleteSession(sessionIndex: number) {
        if (sessionIndex > -1) {
            const sessionToDelete = this.sessions[sessionIndex];
            sessionToDelete.Expanded = true;
            sessionToDelete.DeletingFailure = '';
            sessionToDelete.Deleting = true;
            this._daasService.deleteDaasSession(this.siteToBeDiagnosed, sessionToDelete.SessionId)
                .subscribe(resp => {
                    sessionToDelete.Deleting = false;
                    this.sessions.splice(sessionIndex, 1);
                }, err => {
                    sessionToDelete.Deleting = false;
                    sessionToDelete.DeletingFailure = 'Failed while deleting the session with an error : ' + err;
                });
        }
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    getSessionSize(session:Session){
        if (session.LogFilesSize && session.LogFilesSize > 0){
            return " (" + FormatHelper.formatBytes(session.LogFilesSize, 2) + ")";
        }
    }

}

@Pipe({ name: 'datetimediff' })
export class DateTimeDiffPipe implements PipeTransform {
    transform(datetime: string): string {

        const utc = new Date(new Date().toUTCString()).getTime();
        const newDate = new Date(datetime + 'Z');
        const oneDay = 1000 * 60 * 60 * 24;
        const duration = utc.valueOf() - newDate.valueOf();
        const inDays = Math.round(duration / oneDay);
        const inHours = Math.round(duration * 24 / oneDay);
        const inMinutes = Math.round(duration * 24 * 60 / oneDay);
        return (inDays > 0 ? inDays.toString() + ' day(s)' : (inHours > 0 ? inHours.toString() + ' hour(s)' : inMinutes.toString() + ' minute(s)'));
    }
}
