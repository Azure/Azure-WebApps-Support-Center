import { Component, Input, OnInit, Pipe, PipeTransform } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { PortalActionService, SiteService, ServerFarmDataService, DaasService} from '../../../../shared/services'
import { SiteProfilingInfo } from '../../../../shared/models/solution-metadata';

import { Subscription } from 'rxjs';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { Observable } from 'rxjs/Observable';
import { Diagnoser } from '../../../../shared/models/idaassession';

@Pipe({name: 'groupBy'})
export class GroupByPipe implements PipeTransform {
  transform(value: Array<any>, field: string): Array<any> {
    const groupedObj = value.reduce((prev, cur)=> {
      if(!prev[cur[field]]) {
        prev[cur[field]] = [cur];
      } else {
        prev[cur[field]].push(cur);
      }
      return prev;
    }, {});
    return Object.keys(groupedObj).map(key => ({ key, value: groupedObj[key] }));
  }
}

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
    diagnoserSession:Diagnoser;
    
    subscription: Subscription;

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

    // checkRunningSessions(newSessionId:string=""):boolean
    // {
    //     console.log("Executing running sessions check called with " + newSessionId)
    //     console.log("newSessionId.length" + newSessionId.length);

    //     var inProgress = false;
    //     this._daasService.getDaasSessions(this.siteToBeProfiled.subscriptionId, this.siteToBeProfiled.resourceGroupName, this.siteToBeProfiled.siteName)
    //     .subscribe(x=>
    //         {
    //             if (newSessionId.length==0)
    //             {
    //                 x.forEach(function (session) {                
    //                     // If any of the sessions is less than 3 (i.e. Active or InProgress)
    //                     if (session.Status < 3)
    //                     {
    //                         console.log("newSessionId length = 0, Found session " + session.SessionId + " status =" + session.Status);
    //                         inProgress = true;
    //                     }
    //                     else
    //                     {
    //                         console.log("newSessionId length = 0,  Found session " + session.SessionId + " status =" + session.Status);
    //                     }
    //                 });
    //             }
    //             else
    //             {
    //                 console.log("Finding session with Id "+ newSessionId);

    //                 var runningSession = x.find(x=>x.SessionId==newSessionId);

    //                 if (runningSession)
    //                 {
    //                     console.log("Found Running Session");
                        
    //                     if (runningSession.Status < 3)
    //                     {
    //                         console.log("Found a running session with status less than 3");
    //                         inProgress = true;

    //                         runningSession.DiagnoserSessions.find(x=>x.Name=="CLR Profiler")
    //                     }
    //                 }
    //                 else
    //                 {
    //                     console.log("cannot find session with session id " + newSessionId);
    //                 }
    //             }
    //             this.sessionsInProgress = inProgress;
    //             console.log("Is Session in progress= "+ this.sessionsInProgress );
        
    //             if (inProgress == false)
    //             {
    //                 console.log("inProgress= "+ this.sessionsInProgress );
        
    //                 if (newSessionId.length>0)
    //                 {
    //                 if (this.subscription)
    //                 {
    //                     this.subscription.unsubscribe();
    //                     console.log("unsubscribing");
    //                 }
    //             }
    //         }
    //     }
    //     );

    //     return this.sessionsInProgress;
    // }

    checkRunningSessions(newSessionId:string=""):boolean
    {
        console.log("Executing running sessions check called with " + newSessionId)
        console.log("newSessionId.length" + newSessionId.length);

        var inProgress = false;

        if (newSessionId.length==0)
        {
            this._daasService.getDaasSessions(this.siteToBeProfiled.subscriptionId, this.siteToBeProfiled.resourceGroupName, this.siteToBeProfiled.siteName)
            .subscribe(x=>
                {
                    x.forEach(function (session) {                
                    // If any of the sessions is less than 3 (i.e. Active or InProgress)
                    if (session.Status < 3)
                    {
                        console.log("newSessionId length = 0, Found session " + session.SessionId + " status =" + session.Status);
                        inProgress = true;
                    }
                    else
                    {
                        console.log("newSessionId length = 0,  Found session " + session.SessionId + " status =" + session.Status);
                    }
                    });

                    this.sessionsInProgress = inProgress;
                });            
        }
        else
        {
            this._daasService.getDaasSessionWithDetails(this.siteToBeProfiled.subscriptionId, this.siteToBeProfiled.resourceGroupName, this.siteToBeProfiled.siteName,newSessionId)
            .subscribe(runningSession=>{
                console.log("Finding session with Id "+ newSessionId);
                    if (runningSession.Status < 3)
                    {
                        console.log("Found a running session with status less than 3");
                        inProgress = true;
                        var clrDiagnoser = runningSession.DiagnoserSessions.find(x=>x.Name=="CLR Profiler");
                        if (clrDiagnoser)
                        {
                            this.diagnoserSession = clrDiagnoser;

                            console.log("clrdiagnoser found");

                            console.log("clrDiagnoser.AnalyzerStatus = " + clrDiagnoser.AnalyzerStatus);
                            console.log("clrDiagnoser.CollectorStatus = " + clrDiagnoser.CollectorStatus);

                            console.log("clrDiagnoser.AnalyzerStatusMessages = " + clrDiagnoser.AnalyzerStatusMessages.length);
                            console.log("clrDiagnoser.CollectorStatusMessages = " + clrDiagnoser.CollectorStatusMessages.length);
                            
                            if (clrDiagnoser.CollectorStatus==2)
                            {
                                if (clrDiagnoser.CollectorStatusMessages.length >0)
                                {
                                    console.log(clrDiagnoser.CollectorStatusMessages[clrDiagnoser.CollectorStatusMessages.length -1].Message);

                                    
                                }
                            
                            }
                            else if (clrDiagnoser.AnalyzerStatus==2)
                            {
                                if (clrDiagnoser.AnalyzerStatusMessages.length>0)
                                {
                                    console.log(clrDiagnoser.AnalyzerStatusMessages[clrDiagnoser.AnalyzerStatusMessages.length -1].Message);
                                }                            
                            }                            
                        }
                        else
                        {
                            console.log("no clrdiangoser found");
                        }
                    }
                    else
                    {
                        if (this.subscription)
                        {
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

        // just an additional check, ideally the button
        // itself shouldn't be visible in the UI
        // if there are any active sesssions.
        if (this.checkRunningSessions()==false)
        {
        var submitNewSession = this._daasService.submitDaasSession(this.siteToBeProfiled.subscriptionId, this.siteToBeProfiled.resourceGroupName, this.siteToBeProfiled.siteName)
         .subscribe(result => {
             console.log("new session submitted");
             console.log(result);
             this.SessionId = result;
             console.log("printing session id" + this.SessionId);

             this.subscription = Observable.interval(5000).subscribe(res => {
                this.checkRunningSessions(this.SessionId);
                // Something happens here
            });
         });

         this.sessionsInProgress = true;

        //  var timer = TimerObservable.create(100, 10000);

        //  this.subscription = timer.subscribe( t => {
        //    this.checkRunningSessions();
        //  });

       
        
        }

        // this._daasService.getDaasSessionWithDetails(this.siteToBeProfiled.subscriptionId, this.siteToBeProfiled.resourceGroupName, this.siteToBeProfiled.siteName, this.SessionId)
        // .subscribe(result => {
        //     console.log("checking for sessions")
        //     result.DiagnoserSessions.forEach(function (diagnoserSession)
        //     {
        //         console.log("Collector = " + diagnoserSession.CollectorStatus);

        //         console.log("AnalyzerStatus = " + diagnoserSession.AnalyzerStatus);

        //     });
        // })

    }
}