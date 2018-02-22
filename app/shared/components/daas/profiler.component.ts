import { Component, Input, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { Observable } from 'rxjs/Observable';
import { Diagnoser, Session, Report } from '../../models/daas';
import { SiteDaasInfo } from '../../models/solution-metadata';
import { StepWizardSingleStep } from '../../models/step-wizard-single-step';
import { DaasService, WindowService, AvailabilityLoggingService } from '../../services';


@Component({
    selector : 'profiler',
    templateUrl: 'profiler.component.html',
    styleUrls: ['profiler.component.css']
})

export class ProfilerComponent implements OnInit, OnDestroy {

    @Input() siteToBeProfiled: SiteDaasInfo;
    @Input() scmPath: string;

    @Output() checkingExistingSessionsEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() SessionsEvent: EventEmitter<Session[]> = new EventEmitter<Session[]>();

    Sessions: Session[];
    checkingExistingSessions: boolean;
        
    instances: string[];
    SessionId: string;
    sessionInProgress: boolean;
    diagnoserSession: Diagnoser;
    subscription: Subscription;
    sessionStatus: number;
    
    InstancesStatus: Map<string, number>;
    selectedInstance: string;
    Reports: Report[];

    SessionCompleted: boolean;
    WizardSteps: StepWizardSingleStep[] = [];

    error: any;
    retrievingInstances: boolean = false;
    retrievingInstancesFailed: boolean = false;

    constructor(private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService) {

    }

    ngOnInit(): void {

        this.SessionCompleted = false;
        this.retrievingInstances = true;
        this._daasService.getInstances(this.siteToBeProfiled).retry(2)
            .subscribe(result => {
                this.retrievingInstances = false;
                this.instances = result;
                this.checkRunningSessions();
            },
                error => {
                    this.error = error;
                    this.retrievingInstances = false;
                    this.retrievingInstancesFailed = true;
                });
        this.initWizard();

    }

    initWizard(): void {

        this.WizardSteps.push({
            Caption: "Step 1: Starting Profier",
            IconType: "fa-play",
            AdditionalText: ""
        });

        this.WizardSteps.push({
            Caption: "Step 2: Reproduce the issue now",
            IconType: "fa-clock-o",
            AdditionalText: "Profiler trace will stop automatically after 60 seconds unless overriden explicitly"
        });

        this.WizardSteps.push({
            Caption: "Step 3: Stopping profiler",
            IconType: "fa-stop",
            AdditionalText: ""
        });

        this.WizardSteps.push({
            Caption: "Step 4: Analyzing profiler trace",
            IconType: "fa-cog",
            AdditionalText: ""
        });

    }

    takeTopFiveProfilingSessions(sessions: Session[]): Session[] {
        var arrayToReturn = new Array<Session>();
        sessions.forEach(session => {
            session.DiagnoserSessions.forEach(diagnoser => {
                if (diagnoser.Name === "CLR Profiler") {
                    arrayToReturn.push(session);
                }
            });
        });

        if (arrayToReturn.length > 5) {
            arrayToReturn = arrayToReturn.slice(0, 5);
        }
        return arrayToReturn;
    }

    checkRunningSessions() {
        this.checkingExistingSessions = true;
        this.checkingExistingSessionsEvent.emit(true);

        this._daasService.getDaasSessionsWithDetails(this.siteToBeProfiled).retry(2)
            .subscribe(sessions => {
                this.checkingExistingSessions = false;
                this.checkingExistingSessionsEvent.emit(false);
                
                this.Sessions = this.takeTopFiveProfilingSessions(sessions);
                this.SessionsEvent.emit(this.Sessions);
                
                var runningSession;
                for (var index = 0; index < sessions.length; index++) {
                    if (sessions[index].Status === 0)  // Check Active Sessions only
                    {
                        var clrDiagnoser = sessions[index].DiagnoserSessions.find(x => x.Name === "CLR Profiler");
                        if (clrDiagnoser) {
                            runningSession = sessions[index];
                            break;
                        }
                    }
                }
                if (runningSession) {
                    this.sessionInProgress = true;
                    this.updateInstanceInformation();
                    this.getProfilingStateFromSession(runningSession);
                    this.SessionId = runningSession.SessionId;
                    this.subscription = Observable.interval(10000).subscribe(res => {
                        this.pollRunningSession(this.SessionId);
                    });
                }
            });
    }

    pollRunningSession(sessionId: string) {
        var inProgress = false;
        this._daasService.getDaasSessionWithDetails(this.siteToBeProfiled, sessionId)
            .subscribe(runningSession => {
                if (runningSession.Status === 0) {
                    inProgress = true;
                    this.getProfilingStateFromSession(runningSession);
                }
                else {
                    this.sessionInProgress = false;

                    // stop our timer at this point
                    if (this.subscription) {
                        this.subscription.unsubscribe();
                    }

                    var clrDiagnoser = runningSession.DiagnoserSessions.find(x => x.Name === "CLR Profiler");
                    if (clrDiagnoser) {
                        this.Reports = clrDiagnoser.Reports;
                        this.SessionCompleted = true;
                    }
                }
                this.sessionInProgress = inProgress;
            });
    }

    getProfilingStateFromSession(session: Session) {
        var clrDiagnoser = session.DiagnoserSessions.find(x => x.Name === "CLR Profiler");
        if (clrDiagnoser) {
            this.diagnoserSession = clrDiagnoser;
            if (clrDiagnoser.CollectorStatus === 2) {
                if (clrDiagnoser.CollectorStatusMessages.length > 0) {
                    clrDiagnoser.CollectorStatusMessages.forEach(msg => {
                        // The order of this IF check should not be changed
                        if (msg.Message.indexOf('Stopping') >= 0 || msg.Message.indexOf('Stopped') >= 0) {

                            this.InstancesStatus.set(msg.EntityType, 3);
                        }
                        else if (msg.Message.indexOf('seconds') >= 0) {
                            this.InstancesStatus.set(msg.EntityType, 2);
                        }
                    });
                    this.sessionStatus = this.InstancesStatus.get(this.selectedInstance);
                }
            }
            else if (clrDiagnoser.AnalyzerStatus === 2) {

                // once we are at the analyzer, lets just set all instances's status to 
                // analyzing as we will reach here once all the collectors have finsihed                
                this.sessionStatus = 4;

            }
        }
    }

    updateInstanceInformation() {
        this.InstancesStatus = new Map<string, number>();
        this.instances.forEach(x => {
            this.InstancesStatus.set(x, 1);
        });
        if (this.instances.length > 0) {
            this.selectedInstance = this.instances[0];
        }
    }

    collectProfilerTrace() {
        //this._logger.LogSolutionTried('CLR Profiling', this.data.solution.order.toString(), 'inline', '');
        this.sessionInProgress = true;
        this.updateInstanceInformation();

        var submitNewSession = this._daasService.submitDaasSession(this.siteToBeProfiled, "CLR Profiler", [])
            .subscribe(result => {
                this.sessionStatus = 1;
                this.SessionId = result;
                this.subscription = Observable.interval(10000).subscribe(res => {
                    this.pollRunningSession(this.SessionId);
                });
            },
                error => {
                    this.error = error;
                    this.sessionInProgress = false;
                });
    }

    onInstanceChange(instanceSelected: string): void {
        this.selectedInstance = instanceSelected;
    }

    openReport(url: string) {
        this._windowService.open(`https://${this.scmPath}/api/vfs/data/DaaS/${url}`);
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

    }
}