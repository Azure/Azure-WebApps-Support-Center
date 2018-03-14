import { Component, Input, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { SiteDaasInfo } from '../../models/solution-metadata';
import { Session, Diagnoser, Report, DiagnoserDefinition } from '../../models/daas';
import { Subscription } from 'rxjs';
import { StepWizardSingleStep } from '../../models/step-wizard-single-step';
import { Observable } from 'rxjs/Observable';
import { SiteService } from '../../services/site.service';
import { DaasService } from '../../services/daas.service';
import { WindowService } from '../../services/window.service';
import { AvailabilityLoggingService } from '../../services/logging/availability.logging.service';
import { ServerFarmDataService } from '../../services/server-farm-data.service';

class InstanceSelection {
    InstanceName: string;
    Selected: boolean;
}

@Component({
    selector: 'daas',
    templateUrl: 'daas.component.html',
    styleUrls: ['daas.component.css'
    ]
})
export class DaasComponent implements OnInit, OnDestroy {

    @Input() siteToBeDiagnosed: SiteDaasInfo;
    @Input() scmPath: string;
    @Input() DiagnoserName: string;

    @Output() checkingExistingSessionsEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() SessionsEvent: EventEmitter<Session[]> = new EventEmitter<Session[]>();

    instances: string[];
    instancesToDiagnose: string[];
    InstancesSelected: InstanceSelection[];
    SessionId: string;
    sessionInProgress: boolean;
    diagnoserSession: Diagnoser;
    subscription: Subscription;
    sessionStatus: number;
    Sessions: Session[];
    InstancesStatus: Map<string, number>;
    selectedInstance: string;
    operationInProgress: boolean;
    operationStatus: string;
    Reports: Report[];
    SessionCompleted: boolean;
    WizardSteps: StepWizardSingleStep[] = [];

    WizardStepStatus: string;

    error: any;
    retrievingInstancesFailed: boolean = false;

    daasValidated: boolean = false;

    constructor(private _serverFarmService: ServerFarmDataService, private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService) {

    }

    onDaasValidated(validated: boolean) {
        this.daasValidated = true;
        this.SessionCompleted = false;
        this.operationInProgress = true;
        this.operationStatus = "Retrieving instances..."

        this._daasService.getInstances(this.siteToBeDiagnosed).retry(2)
            .subscribe(result => {
                this.operationInProgress = false;
                this.operationStatus = "";

                this.instances = result;
                this.checkRunningSessions();
                this.populateinstancesToDiagnose();
                this.initWizard();
            },
                error => {
                    this.error = error;
                    this.operationInProgress = false;
                    this.retrievingInstancesFailed = true;
                });
    }

    ngOnInit(): void {

    }

    initWizard(): void {

        this.WizardSteps.push({
            Caption: "Step 1: Initializing Diagnostics ",
            IconType: "fa-play",
            AdditionalText: ""
        });

        this.WizardSteps.push({
            Caption: "Step 2: Collecting " + this.DiagnoserName,
            IconType: "fa-clone",
            AdditionalText: ""
        });

        this.WizardSteps.push({
            Caption: "Step 3: Analyzing " + this.DiagnoserName,
            IconType: "fa-cog",
            AdditionalText: ""
        });

    }

    takeTopFiveDiagnoserSessions(sessions: Session[]): Session[] {
        var arrayToReturn = new Array<Session>();
        sessions.forEach(session => {
            session.DiagnoserSessions.forEach(diagnoser => {
                if (diagnoser.Name === this.DiagnoserName) {
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
        this.operationInProgress = true;
        this.operationStatus = "Checking existing sessions...";
        this.checkingExistingSessionsEvent.emit(true);

        this._daasService.getDaasSessionsWithDetails(this.siteToBeDiagnosed).retry(2)
            .subscribe(sessions => {
                this.operationInProgress = false;
                this.operationStatus = "";
                this.checkingExistingSessionsEvent.emit(false);

                this.Sessions = this.takeTopFiveDiagnoserSessions(sessions);
                this.SessionsEvent.emit(this.Sessions);

                var runningSession;
                for (var index = 0; index < sessions.length; index++) {
                    if (sessions[index].Status === 0)  // Check Active Sessions only
                    {
                        var daasDiagnoser = sessions[index].DiagnoserSessions.find(x => x.Name === this.DiagnoserName);
                        if (daasDiagnoser) {
                            runningSession = sessions[index];
                            break;
                        }
                    }
                }
                if (runningSession) {
                    this.sessionInProgress = true;
                    this.updateInstanceInformationOnLoad();
                    this.getDiagnoserStateFromSession(runningSession);
                    this.SessionId = runningSession.SessionId;
                    this.subscription = Observable.interval(10000).subscribe(res => {
                        this.pollRunningSession(this.SessionId);
                    });
                }
            });
    }

    pollRunningSession(sessionId: string) {
        var inProgress = false;
        this._daasService.getDaasSessionWithDetails(this.siteToBeDiagnosed, sessionId)
            .subscribe(runningSession => {
                if (runningSession.Status === 0) {
                    inProgress = true;
                    this.getDiagnoserStateFromSession(runningSession);
                }
                else {
                    this.sessionInProgress = false;

                    // stop our timer at this point
                    if (this.subscription) {
                        this.subscription.unsubscribe();
                    }

                    var daasDiagnoser = runningSession.DiagnoserSessions.find(x => x.Name === this.DiagnoserName);
                    if (daasDiagnoser) {
                        this.Reports = daasDiagnoser.Reports;
                        this.SessionCompleted = true;
                    }
                }
                this.sessionInProgress = inProgress;
            });
    }

    getDiagnoserStateFromSession(session: Session) {
        var daasDiagnoser = session.DiagnoserSessions.find(x => x.Name === this.DiagnoserName);
        if (daasDiagnoser) {
            this.diagnoserSession = daasDiagnoser;
            if (daasDiagnoser.CollectorStatus === 2) {
                this.sessionStatus = 2;

                if (daasDiagnoser.CollectorStatusMessages.length > 0) {
                    var thisInstanceMessages = daasDiagnoser.CollectorStatusMessages.filter(x => x.EntityType === this.selectedInstance);
                    var messagesLength = daasDiagnoser.CollectorStatusMessages.length;
                    if (messagesLength > 0) {
                        this.WizardStepStatus = thisInstanceMessages[messagesLength - 1].Message
                    }
                }
            }
            else if (daasDiagnoser.AnalyzerStatus === 2) {
                this.WizardStepStatus = "";
                this.sessionStatus = 3;
            }
        }
    }

    updateInstanceInformationOnLoad() {
        this.InstancesStatus = new Map<string, number>();
        this.instances.forEach(x => {
            this.InstancesStatus.set(x, 1);
        });
        if (this.instances.length > 0) {
            this.selectedInstance = this.instances[0];
        }
    }

    updateInstanceInformation() {
        this.InstancesStatus = new Map<string, number>();

        if (this.instancesToDiagnose.length > 0) {
            this.instancesToDiagnose.forEach(x => {
                this.InstancesStatus.set(x, 1);
            });

            this.selectedInstance = this.instances[0];
        }
    }

    populateinstancesToDiagnose() {
        this.InstancesSelected = new Array();

        if (this.instances && this.instances.length > 0) {
            this.instances.forEach(x => {
                let s = new InstanceSelection();
                s.InstanceName = x;
                s.Selected = true;
                this.InstancesSelected.push(s);
            });
        }
    }

    collectDiagnoserData() {
        this.instancesToDiagnose = new Array<string>();

        if (this.InstancesSelected && this.InstancesSelected !== null) {
            this.InstancesSelected.forEach(x => {
                if (x.Selected) {
                    this.instancesToDiagnose.push(x.InstanceName);
                }
            });
        }

        if (this.instancesToDiagnose.length === 0) {
            alert("Please choose at-least one instance");
            return false;
        }

        this.sessionInProgress = true;
        this.updateInstanceInformation();

        var submitNewSession = this._daasService.submitDaasSession(this.siteToBeDiagnosed, this.DiagnoserName, this.instancesToDiagnose)
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