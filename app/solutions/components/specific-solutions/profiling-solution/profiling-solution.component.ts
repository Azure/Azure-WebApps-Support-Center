import { Component, Input, OnInit, Pipe, PipeTransform } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { PortalActionService, SiteService, ServerFarmDataService, DaasService } from '../../../../shared/services'
import { SiteProfilingInfo } from '../../../../shared/models/solution-metadata';

import { Subscription } from 'rxjs';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { Observable } from 'rxjs/Observable';
import { Diagnoser, DiagnoserStatusMessage, Session } from '../../../../shared/models/idaassession';

@Component({
    templateUrl: 'profiling-solution.component.html',
    styleUrls: ['../../../styles/solutions.css',
        'profiling-solution.component.css'
    ]
})
export class ProfilingComponent implements SolutionBaseComponent, OnInit {

    @Input() data: SolutionData;

    title: string = "Collect a Profiler Trace";
    description: string = "If your app is down or performing slow, you can collect a profiling trace to identify the root cause of the issue. Profiling is light weight and is designed for production scenarios.";

    thingsToKnowBefore: string[] = [
        "Once the profiler trace is started, you should reproduce the issue by browsing to the WebApp",
        "The profiler trace will automatically stop after 60 seconds.",
        "Your application will not be restarted as a result of running the profiler.",
        "A profiler trace will help to identify issues in an ASP.NET application only and ASP.NET core is not yet supported",
    ]

    siteToBeProfiled: SiteProfilingInfo;
    instances: string[];
    SessionId: string;
    sessionsInProgress: boolean;
    diagnoserSession: Diagnoser;
    subscription: Subscription;
    spinnerMessage: string;
    sessionStatus: number;
    Sessions: Session[];
    InstancesStatus: Map<string, number>;

    constructor(private _siteService: SiteService, private _daasService: DaasService, _portalActionService: PortalActionService, _serverFarmService: ServerFarmDataService) {

    }

    ngOnInit(): void {

        this.sessionsInProgress = false;
        this.siteToBeProfiled = MetaDataHelper.getProfilingData(this.data.solution.data);
        this._daasService.getInstances(this.siteToBeProfiled.subscriptionId, this.siteToBeProfiled.resourceGroupName, this.siteToBeProfiled.siteName)
            .subscribe(result => {
                this.instances = result;
            });

        this.checkRunningSessions();
    }

    takeTopFiveProfilingSessions(sessions: Session[]): Session[] {
        var arrayToReturn = new Array<Session>();
        sessions.forEach(session => {
            session.DiagnoserSessions.forEach(diagnoser => {
                if (diagnoser.Name == "CLR Profiler") {
                    arrayToReturn.push(session);
                }
            });
        });

        console.log("Sessions Array lenght = " + arrayToReturn.length);

        if (arrayToReturn.length > 5) {
            arrayToReturn = arrayToReturn.slice(0, 4);
        }

        return arrayToReturn;
    }
    checkRunningSessions(newSessionId: string = ""): boolean {
        console.log("Executing running sessions check called with " + newSessionId)
        console.log("newSessionId.length" + newSessionId.length);

        var inProgress = false;

        if (newSessionId.length == 0) {

            this.spinnerMessage = "Waiting for existing sessions...";

            this._daasService.getDaasSessionsWithDetails(this.siteToBeProfiled.subscriptionId, this.siteToBeProfiled.resourceGroupName, this.siteToBeProfiled.siteName)
                .subscribe(x => {
                    this.Sessions = this.takeTopFiveProfilingSessions(x);
                    x.forEach(function (session) {
                        // If any of the sessions is less than 3 (i.e. Active or InProgress)
                        if (session.Status < 3) {
                            inProgress = true;
                        }
                    });
                    this.sessionsInProgress = inProgress;
                });
        }
        else {
            this.spinnerMessage = "Running...";
            this._daasService.getDaasSessionWithDetails(this.siteToBeProfiled.subscriptionId, this.siteToBeProfiled.resourceGroupName, this.siteToBeProfiled.siteName, newSessionId)
                .subscribe(runningSession => {
                    console.log("Finding session with Id " + newSessionId);
                    if (runningSession.Status < 3) {
                        console.log("Found a running session with status less than 3");
                        inProgress = true;
                        var clrDiagnoser = runningSession.DiagnoserSessions.find(x => x.Name == "CLR Profiler");
                        if (clrDiagnoser) {
                            this.diagnoserSession = clrDiagnoser;

                            console.log("clrDiagnoser.AnalyzerStatus = " + clrDiagnoser.AnalyzerStatus);
                            console.log("clrDiagnoser.CollectorStatus = " + clrDiagnoser.CollectorStatus);
                            console.log("clrDiagnoser.AnalyzerStatusMessages = " + clrDiagnoser.AnalyzerStatusMessages.length);
                            console.log("clrDiagnoser.CollectorStatusMessages = " + clrDiagnoser.CollectorStatusMessages.length);

                            if (clrDiagnoser.CollectorStatus == 2) {
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

                                    var profilerWaitingMessage = clrDiagnoser.CollectorStatusMessages.find(x => x.Message.indexOf('seconds') >= 0);
                                    if (profilerWaitingMessage) {
                                        this.sessionStatus = 2;
                                    }
                                    var stoppingMessage = clrDiagnoser.CollectorStatusMessages.find(x => (x.Message.indexOf('Stopping') >= 0 || x.Message.indexOf('Stopped') >= 0));
                                    if (stoppingMessage) {
                                        this.sessionStatus = 3;
                                    }
                                    console.log(clrDiagnoser.CollectorStatusMessages[clrDiagnoser.CollectorStatusMessages.length - 1].Message);
                                }
                            }
                            else if (clrDiagnoser.AnalyzerStatus == 2) {

                                this.InstancesStatus.forEach(function (value, key) {
                                    this.InstancesStatus.set(key, 4);
                                });

                                this.sessionStatus = 4;
                                if (clrDiagnoser.AnalyzerStatusMessages.length > 0) {
                                    console.log(clrDiagnoser.AnalyzerStatusMessages[clrDiagnoser.AnalyzerStatusMessages.length - 1].Message);
                                }
                            }
                        }
                    }
                    else {
                        // stop our timer at this point
                        if (this.subscription) {
                            this.subscription.unsubscribe();
                            console.log("unsubscribing");
                        }
                    }
                    this.sessionsInProgress = inProgress;
                });
        }
        return this.sessionsInProgress;
    }

    collectProfilerTrace() {
        this.sessionsInProgress = true;
        this.InstancesStatus =  new Map<string, number>();
        
        var submitNewSession = this._daasService.submitDaasSession(this.siteToBeProfiled.subscriptionId, this.siteToBeProfiled.resourceGroupName, this.siteToBeProfiled.siteName)
            .subscribe(result => {

                this.instances.forEach(x => {
                    this.InstancesStatus.set(x, 1);
                });

                this.sessionStatus = 1;
                console.log("new session submitted");
                console.log(result);
                this.SessionId = result;
                console.log("printing session id" + this.SessionId);

                this.subscription = Observable.interval(5000).subscribe(res => {
                    this.checkRunningSessions(this.SessionId);
                    // Something happens here
                });
            });
    }
}