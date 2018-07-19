import {Injectable} from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs/Rx';
import {StartupInfo, Event, Data, Verbs, Action, LogEntryLevel, Message, OpenBladeInfo} from '../../shared/models/portal';
import {ErrorEvent} from '../../shared/models/error-event';
import {BroadcastService} from './broadcast.service';
import  {BroadcastEvent} from '../models/broadcast-event'

@Injectable()
export class PortalService {
    public sessionId = "";
    private portalSignature: string = "FxFrameBlade";
    private startupInfoObservable : ReplaySubject<StartupInfo>;
    private appInsightsResourceObservable: ReplaySubject<any>;
    private shellSrc: string;

    constructor(private _broadcastService : BroadcastService) {
        this.sessionId = "";

        this.startupInfoObservable = new ReplaySubject<StartupInfo>(1);
        this.appInsightsResourceObservable = new ReplaySubject<any>(1);
        if (this.inIFrame()) {
            this.initializeIframe();
        }
    }

    getStartupInfo(): ReplaySubject<StartupInfo> {
        return this.startupInfoObservable;
    }

    getAppInsightsResourceInfo(): ReplaySubject<any>{
        return this.appInsightsResourceObservable;
    }

    initializeIframe(): void {
        this.shellSrc = this.getQueryStringParameter("trustedAuthority");

        window.addEventListener(Verbs.message, this.iframeReceivedMsg.bind(this), false);

        // This is a required message. It tells the shell that your iframe is ready to receive messages.
        this.postMessage(Verbs.ready, null);
        this.postMessage(Verbs.getStartupInfo, null);
        
        this._broadcastService.subscribe<ErrorEvent>(BroadcastEvent.Error, error => {
            if (error.details) {
                this.logMessage(LogEntryLevel.Error, error.details);
            }
        });
    }

    openBlade(bladeInfo : OpenBladeInfo, source : string){
        this.postMessage(Verbs.openBlade, JSON.stringify(bladeInfo));
    }

    openSupportRequestBlade(obj: any, source: string): void {
        this.logAction(source, "open-blade-input" + obj.bladeName, null);
        let inputStr = JSON.stringify(obj);
        this.postMessage(Verbs.openSupportRequestBlade, inputStr);
    }

    closeBlades() {
        this.postMessage(Verbs.closeBlades, "");
    }

    logAction(subcomponent: string, action: string, data?: any): void{
        let actionStr = JSON.stringify(<Action>{
            subcomponent: subcomponent,
            action: action,
            data: data
        });

        this.postMessage(Verbs.logAction, actionStr);
    }

    setDirtyState(dirty : boolean) : void{
        this.postMessage(Verbs.setDirtyState, JSON.stringify(dirty));
    }

    logMessage(level : LogEntryLevel, message : string, ...restArgs: any[]){
        let messageStr = JSON.stringify(<Message>{
            level : level,
            message : message,
            restArgs : restArgs
        });

        this.postMessage(Verbs.logMessage, messageStr);
    }

    private iframeReceivedMsg(event: Event): void {

        if (!event || !event.data || event.data.signature !== this.portalSignature){
            return;
        }

        var data = event.data.data;
        let methodName = event.data.kind;
        console.log("[iFrame] Received mesg: " + methodName);

        if (methodName === Verbs.sendStartupInfo) {
            let info = <StartupInfo>data;
            this.sessionId = info.sessionId;
            this.startupInfoObservable.next(info);
        }
        else if(methodName === Verbs.sendAppInsightsResource){
            let aiResource = data;
            this.appInsightsResourceObservable.next(aiResource);
        }
    }

    public postMessage(verb: string, data: string){
        if(this.inIFrame()) {
            window.parent.postMessage(<Data>{
                signature : this.portalSignature,
                kind: verb,
                data: data
            }, this.shellSrc);
        }
    }

    private inIFrame() : boolean{
        return window.parent !== window;
    }

    private getQueryStringParameter(name: string){
        return this.getQueryMap()[name] || "";
    }

    private getQueryMap(): any {
        var query = window.location.search.substring(1);
        var parameterList = query.split("&");
        var map = {};
        for (var i = 0; i < parameterList.length; i++) {
            var pair = parameterList[i].split("=");
            map[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return map;
    }
}