import { Injectable, isDevMode } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { StartupInfo, Event, Data, Verbs, Action, LogEntryLevel, Message, OpenBladeInfo } from '../../shared/models/portal';
import { ErrorEvent } from '../../shared/models/error-event';
import { BroadcastService } from './broadcast.service';
import { BroadcastEvent } from '../models/broadcast-event';

@Injectable()
export class PortalService {
    public sessionId = '';
    private portalSignature: string = 'FxFrameBlade';
    private startupInfoObservable: ReplaySubject<StartupInfo>;
    private appInsightsResourceObservable: ReplaySubject<any>;
    private shellSrc: string;

    constructor(private _broadcastService: BroadcastService) {
        this.sessionId = '';

        this.startupInfoObservable = new ReplaySubject<StartupInfo>(1);
        this.appInsightsResourceObservable = new ReplaySubject<any>(1);
        if (this.inIFrame()) {
            this.initializeIframe();
        }
    }

    getStartupInfo(): ReplaySubject<StartupInfo> {
        return this.startupInfoObservable;
    }

    getAppInsightsResourceInfo(): ReplaySubject<any> {
        return this.appInsightsResourceObservable;
    }

    initializeIframe(): void {
        this.shellSrc = this.getQueryStringParameter('trustedAuthority');

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

    openBlade(bladeInfo: OpenBladeInfo, source: string) {
        this.postMessage(Verbs.openBlade, JSON.stringify(bladeInfo));
    }

    openSupportRequestBlade(obj: any, source: string): void {
        this.logAction(source, 'open-blade-input' + obj.bladeName, null);
        const inputStr = JSON.stringify(obj);
        this.postMessage(Verbs.openSupportRequestBlade, inputStr);
    }

    closeBlades() {
        this.postMessage(Verbs.closeBlades, '');
    }

    logAction(subcomponent: string, action: string, data?: any): void {
        const actionStr = JSON.stringify(<Action>{
            subcomponent: subcomponent,
            action: action,
            data: data
        });

        if (isDevMode()) {
            console.log({ id: subcomponent, category: action, data: data });
        }

        this.postMessage(Verbs.logAction, actionStr);
    }

    setDirtyState(dirty: boolean): void {
        this.postMessage(Verbs.setDirtyState, JSON.stringify(dirty));
    }

    logMessage(level: LogEntryLevel, message: string, ...restArgs: any[]) {
        const messageStr = JSON.stringify(<Message>{
            level: level,
            message: message,
            restArgs: restArgs
        });

        this.postMessage(Verbs.logMessage, messageStr);
    }

    private iframeReceivedMsg(event: Event): void {

        if (!event || !event.data || event.data.signature !== this.portalSignature) {
            return;
        }

        const data = event.data.data;
        const methodName = event.data.kind;
        console.log('[iFrame] Received mesg: ' + methodName);

        if (methodName === Verbs.sendStartupInfo) {
            const info = <StartupInfo>data;
            this.sessionId = info.sessionId;
            this.startupInfoObservable.next(info);
        } else if (methodName === Verbs.sendAppInsightsResource) {
            const aiResource = data;
            this.appInsightsResourceObservable.next(aiResource);
        }
    }

    public postMessage(verb: string, data: string) {
        if (this.inIFrame()) {
            window.parent.postMessage(<Data>{
                signature: this.portalSignature,
                kind: verb,
                data: data
            }, this.shellSrc);
        }
    }

    private inIFrame(): boolean {
        return window.parent !== window;
    }

    private getQueryStringParameter(name: string) {
        return this.getQueryMap()[name] || '';
    }

    private getQueryMap(): any {
        const query = window.location.search.substring(1);
        const parameterList = query.split('&');
        const map = {};
        for (let i = 0; i < parameterList.length; i++) {
            const pair = parameterList[i].split('=');
            map[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return map;
    }
}
