import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { SiteDaasInfo } from '../../../../shared/models/solution-metadata';
import { SiteService, DaasService, WindowService, AvailabilityLoggingService, ServerFarmDataService } from '../../../../shared/services'
import { Subscription } from 'rxjs';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { Observable } from 'rxjs/Observable';
import { Diagnoser, DiagnoserStatusMessage, Session, Report } from '../../../../shared/models/daas';
import { StepWizardSingleStep } from '../../../../shared/models/step-wizard-single-step';
import { StepWizardComponent } from '../../../../shared/components/step-wizard/step-wizard.component';
import { DaasSessionsComponent } from '../../../../shared/components/daas-sessions/daas-sessions.component';


@Component({
    templateUrl: 'profiling-solution.component.html',
    styleUrls: ['../../../styles/solutions.css',
        'profiling-solution.component.css'
    ]
})
export class ProfilingComponent implements SolutionBaseComponent, OnInit, OnDestroy {

    @Input() data: SolutionData;

    title: string = "Collect a Profiler Trace";
    description: string = "If your app is down or performing slow, you can collect a profiling trace to identify the root cause of the issue. Profiling is light weight and is designed for production scenarios.";

    thingsToKnowBefore: string[] = [
        "Once the profiler trace is started, reproduce the issue by browsing to the web app",
        "The profiler trace will automatically stop after 60 seconds.",
        "Your web app will not be restarted as a result of running the profiler.",
        "A profiler trace will help to identify issues in an ASP.NET application only and ASP.NET core is not yet supported",
    ]

    siteToBeProfiled: SiteDaasInfo;
    instances: string[];
    SessionId: string;
    sessionInProgress: boolean;
    diagnoserSession: Diagnoser;
    subscription: Subscription;
    sessionStatus: number;
    Sessions: Session[];
    InstancesStatus: Map<string, number>;
    selectedInstance: string;
    checkingExistingSessions: boolean;
    Reports: Report[];
    scmPath: string;

    SessionCompleted: boolean;
    WizardSteps: StepWizardSingleStep[] = [];
    couldNotFindSite: boolean = false;

    error: any;
    retrievingInstances: boolean = false;
    retrievingInstancesFailed: boolean = false;

    constructor(private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService, private _serverFarmService: ServerFarmDataService) {

    }

    ngOnInit(): void {

        this._logger.LogSolutionDisplayed('CLR Profiling', this.data.solution.order.toString(), 'bot-sitecpuanalysis');

        this.siteToBeProfiled = MetaDataHelper.getSiteDaasData(this.data.solution.data);
        let siteInfo = MetaDataHelper.getSiteDaasData(this.data.solution.data);
        this.SessionCompleted = false;

        this._serverFarmService.sitesInServerFarm.subscribe(sites => {
            let targetedSite = sites.find(site => site.name.toLowerCase() === siteInfo.siteName.toLowerCase());

            if (targetedSite) {
                let siteName = targetedSite.name;
                let slotName = '';
                if (targetedSite.name.indexOf('(') >= 0) {
                    let parts = targetedSite.name.split('(');
                    siteName = parts[0];
                    slotName = parts[1].replace(')', '');
                }

                this.siteToBeProfiled = <SiteDaasInfo>{
                    subscriptionId: siteInfo.subscriptionId,
                    resourceGroupName: targetedSite.resourceGroup,
                    siteName: siteName,
                    slot: slotName
                }

                this.scmPath = targetedSite.hostNames.find(hostname => hostname.indexOf('.scm.') > 0);
                
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
            }
            else {
                this.couldNotFindSite = true;
            }
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
        this._daasService.getDaasSessionsWithDetails(this.siteToBeProfiled).retry(2)
            .subscribe(sessions => {
                this.checkingExistingSessions = false;
                this.Sessions = this.takeTopFiveProfilingSessions(sessions);
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
        this._logger.LogSolutionTried('CLR Profiling', this.data.solution.order.toString(), 'inline', '');
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
        this._windowService.open(`${this.scmPath}/api/vfs/data/DaaS/${url}`);
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

}