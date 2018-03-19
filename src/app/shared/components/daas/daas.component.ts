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
    @Input() DiagnoserNameLookup: string = "";

    @Output() SessionsEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

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
    instancesChanged: boolean = false;

    daasValidated: boolean = false;

    constructor(private _serverFarmService: ServerFarmDataService, private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService) {
    }

    onDaasValidated(validated: boolean) {

        if (this.DiagnoserNameLookup === "") {
            this.DiagnoserNameLookup = this.DiagnoserName;
        }

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

   
    checkRunningSessions() {
        this.operationInProgress = true;
        this.operationStatus = "Checking active sessions...";        

        this._daasService.getDaasActiveSessionsWithDetails(this.siteToBeDiagnosed).retry(2)
            .subscribe(sessions => {
                this.operationInProgress = false;
                this.operationStatus = "";                                            

                var runningSession;
                for (var index = 0; index < sessions.length; index++) {
                    if (sessions[index].Status === 0)  // Check Active Sessions only
                    {
                        var daasDiagnoser = sessions[index].DiagnoserSessions.find(x => x.Name.startsWith(this.DiagnoserNameLookup));
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

                    var daasDiagnoser = runningSession.DiagnoserSessions.find(x => x.Name.startsWith(this.DiagnoserNameLookup));
                    if (daasDiagnoser) {
                        this.Reports = daasDiagnoser.Reports;
                        this.SessionCompleted = true;
                    }

                    // Update the sessions information table when a running session finishes
                    this.SessionsEvent.emit(true);
                }
                this.sessionInProgress = inProgress;
            });
    }

    getDiagnoserStateFromSession(session: Session) {
        var daasDiagnoser = session.DiagnoserSessions.find(x => x.Name.startsWith(this.DiagnoserNameLookup));
        if (daasDiagnoser) {
            this.diagnoserSession = daasDiagnoser;
            if (daasDiagnoser.CollectorStatus === 2) {
                this.sessionStatus = 2;

                if (daasDiagnoser.CollectorStatusMessages.length > 0) {
                    var thisInstanceMessages = daasDiagnoser.CollectorStatusMessages.filter(x => x.EntityType === this.selectedInstance);
                    var messagesLength = thisInstanceMessages.length;
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

    compareInstances(oldInstances: string[], newInstances: string[]): boolean {
        return oldInstances.length == newInstances.length && oldInstances.every(function (v, i) { return v === newInstances[i] });
    }

    collectDiagnoserData() {
        
        this.instancesChanged = false;
        this.operationInProgress = true;
        this.operationStatus = "Validating instances..."

        this._daasService.getInstances(this.siteToBeDiagnosed).retry(2)
            .subscribe(result => {
                this.operationInProgress = false;
                this.operationStatus = "";

                if (!this.compareInstances(this.instances, result)) {
                    this.instances = result;
                    this.populateinstancesToDiagnose();
                    this.instancesChanged = true;
                    return;
                }

                this._logger.LogClickEvent(this.DiagnoserName, "DiagnosticTools");
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

                this.Reports = [];
                this.sessionInProgress = true;
                this.sessionStatus = 1;
                this.updateInstanceInformation();

                var submitNewSession = this._daasService.submitDaasSession(this.siteToBeDiagnosed, this.DiagnoserName, this.instancesToDiagnose)
                    .subscribe(result => {
                        this.SessionId = result;
                        this.subscription = Observable.interval(10000).subscribe(res => {
                            this.pollRunningSession(this.SessionId);
                        });
                    },
                        error => {
                            this.error = error;
                            this.sessionInProgress = false;
                        });
            },
                error => {
                    this.error = error;
                    this.operationInProgress = false;
                    this.retrievingInstancesFailed = true;
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
        this.Reports = [];

    }
}