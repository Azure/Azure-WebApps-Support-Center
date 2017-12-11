import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { SiteService, DaasService, WindowService, AvailabilityLoggingService, ServerFarmDataService } from '../../../../shared/services'
import { SiteDaasInfo } from '../../../../shared/models/solution-metadata';
import { Subscription } from 'rxjs';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { Observable } from 'rxjs/Observable';
import { Diagnoser, DiagnoserStatusMessage, Session, Report } from '../../../../shared/models/daas';
import { StepWizardSingleStep } from '../../../../shared/models/step-wizard-single-step';
import { StepWizardComponent } from '../../../../shared/components/step-wizard/step-wizard.component';
import { DaasSessionsComponent } from '../../../../shared/components/daas-sessions/daas-sessions.component';

class InstanceSelection
{
    InstanceName:string;
    Selected:boolean;
}

@Component({
    templateUrl: 'memorydump-solution.component.html',
    styleUrls: ['../../../styles/solutions.css',
        'memorydump-solution.component.css'
    ]
})
export class MemoryDumpComponent implements SolutionBaseComponent, OnInit, OnDestroy {

    @Input() data: SolutionData;

    title: string = "Collect a Memory dump";
    description: string = "If your app is performing slow or not responding at all, you can collect a memory dump to identify the root cause of the issue.";

    thingsToKnowBefore: string[] = [
        "Collecting a memory dump freezes process until dump generation finishes so process cannot serve any requests during this time.",
        "Dumps are collected for the worker process (w3wp.exe) and child processes of the worker process.",
        "Size of the memory dump is directly proportional to the process size, so processes consuming more memory will take longer to be dumped.",
        "Your WebApp will not be restarted as a result of collecting the memory dump."
    ]

    siteToBeDumped: SiteDaasInfo;
    instances: string[];
    instancesToDump: string[];
    InstancesSelected: InstanceSelection[];
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

    constructor(private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService, private _serverFarmService:ServerFarmDataService) {
    }

    ngOnInit(): void {

        this._logger.LogSolutionDisplayed('Memory Dump', this.data.solution.order.toString(), 'bot-sitecpuanalysis');

        this.siteToBeDumped = MetaDataHelper.getSiteDaasData(this.data.solution.data);
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
    
                this.siteToBeDumped = <SiteDaasInfo>{
                    subscriptionId: siteInfo.subscriptionId,
                    resourceGroupName: targetedSite.resourceGroup,
                    siteName: siteName,
                    slot: slotName
                }
    
                this.scmPath = targetedSite.hostNames.find(hostname => hostname.indexOf('.scm.') > 0);
    
                this._daasService.getInstances(this.siteToBeDumped)
                    .subscribe(result => {
                        this.instances = result;
                        this.checkRunningSessions();                
                    });
            }
            else {
                this.couldNotFindSite = true;
            }
        });

        this.initWizard();

        this._daasService.getInstances(this.siteToBeDumped)
            .subscribe(result => {
                this.instances = result;
                this.checkRunningSessions();
                this.populateInstancesToDump();
            });

    }

    initWizard(): void {

        this.WizardSteps.push({
            Caption: "Step 1: Collecting Memory Dump",
            IconType: "fa-play",
            AdditionalText:""
        });

        this.WizardSteps.push({
            Caption: "Step 2: Copying memory Dumps",
            IconType: "fa-clone",
            AdditionalText:""
        });

        this.WizardSteps.push({
            Caption: "Step 3: Analyzing Memory Dump",
            IconType: "fa-cog",
            AdditionalText:""
        });
       
    }

    takeTopFiveMemoryDumpSessions(sessions: Session[]): Session[] {
        var arrayToReturn = new Array<Session>();
        sessions.forEach(session => {
            session.DiagnoserSessions.forEach(diagnoser => {
                if (diagnoser.Name == "Memory Dump") {
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
        this._daasService.getDaasSessionsWithDetails(this.siteToBeDumped)
            .subscribe(sessions => {
                this.checkingExistingSessions = false;
                this.Sessions = this.takeTopFiveMemoryDumpSessions(sessions);
                var runningSession;
                for (var index = 0; index < sessions.length; index++) {
                    if (sessions[index].Status == 0)  // Check Active Sessions only
                    {
                        var dumpDiagnoser = sessions[index].DiagnoserSessions.find(x => x.Name == "Memory Dump");
                        if (dumpDiagnoser) {
                            runningSession = sessions[index];
                            break;
                        }
                    }
                }
                if (runningSession) {
                    this.sessionInProgress = true;
                    this.updateInstanceInformation();
                    this.getMemoryDumpStateFromSession(runningSession);
                    this.SessionId = runningSession.SessionId;
                    this.subscription = Observable.interval(10000).subscribe(res => {
                        this.pollRunningSession(this.SessionId);
                    });
                }
            });
    }

    pollRunningSession(sessionId: string) {
        var inProgress = false;
        this._daasService.getDaasSessionWithDetails(this.siteToBeDumped, sessionId)
            .subscribe(runningSession => {
                if (runningSession.Status == 0) {
                    inProgress = true;
                    this.getMemoryDumpStateFromSession(runningSession);
                }
                else {
                    this.sessionInProgress = false;

                    // stop our timer at this point
                    if (this.subscription) {
                        this.subscription.unsubscribe();
                    }

                    var dumpDiagnoser = runningSession.DiagnoserSessions.find(x => x.Name == "Memory Dump");
                    if (dumpDiagnoser) {
                        this.Reports = dumpDiagnoser.Reports;
                        this.SessionCompleted = true;
                    }
                }
                this.sessionInProgress = inProgress;
            });
    }

    getMemoryDumpStateFromSession(session: Session) {
        var dumpDiagnoser = session.DiagnoserSessions.find(x => x.Name == "Memory Dump");
        if (dumpDiagnoser) {
            this.diagnoserSession = dumpDiagnoser;
            if (dumpDiagnoser.CollectorStatus == 2) {
                if (dumpDiagnoser.CollectorStatusMessages.length > 0) {
                    dumpDiagnoser.CollectorStatusMessages.forEach(msg => {
                        // The order of this IF check should not be changed
                        if (msg.Message.indexOf('Collected') >= 0 || msg.Message.indexOf('Collected') >= 0) {

                            this.InstancesStatus.set(msg.EntityType, 2);
                        }
                    });
                    this.sessionStatus = this.InstancesStatus.get(this.selectedInstance);
                }
            }
            else if (dumpDiagnoser.AnalyzerStatus == 2) {

                // once we are at the analyzer, lets just set all instances's status to 
                // analyzing as we will reach here once all the collectors have finsihed                
                this.sessionStatus = 3;

            }
        }
    }

    updateInstanceInformation() {
        this.InstancesStatus = new Map<string, number>();

        if (this.instancesToDump.length > 0) {
            this.instancesToDump.forEach(x => {
                this.InstancesStatus.set(x, 1);
            });

            this.selectedInstance = this.instances[0];
        }
    }

    populateInstancesToDump() {
        this.InstancesSelected = new Array();
        
        this.instances.forEach(x => {
            let s = new InstanceSelection();
            s.InstanceName = x;
            s.Selected = true;
            this.InstancesSelected.push(s);
        });
    }

    collectMemoryDump() {
        this.instancesToDump = new Array<string>();

        this.InstancesSelected.forEach(x=>{
            if (x.Selected)
            {
                this.instancesToDump.push(x.InstanceName);
            }
        });
        
        if (this.instancesToDump.length == 0) {
            alert("Please choose at-least one instance");
            return false;
        }

        this._logger.LogSolutionTried('Memory Dump', this.data.solution.order.toString(), 'inline', '');
        this.sessionInProgress = true;

        this.updateInstanceInformation();

        var submitNewSession = this._daasService.submitDaasSession(this.siteToBeDumped, "Memory Dump", this.instancesToDump)
            .subscribe(result => {
                this.sessionStatus = 1;
                this.SessionId = result;
                this.subscription = Observable.interval(10000).subscribe(res => {
                    this.pollRunningSession(this.SessionId);
                });
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