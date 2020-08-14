import { Injectable, isDevMode } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { StartupInfo, Event, Data, Verbs, Action, LogEntryLevel, Message, OpenBladeInfo, KeyValuePair } from '../../shared/models/portal';
import { ErrorEvent } from '../../shared/models/error-event';
import { BroadcastService } from './broadcast.service';
import { BroadcastEvent } from '../models/broadcast-event';

@Injectable()
export class PortalService {
    public sessionId = '';
    private portalSignature: string = 'FxFrameBlade';
    private startupInfoObservable: ReplaySubject<StartupInfo>;
    private appInsightsResourceObservable: ReplaySubject<any>;

    private sendChatAvailabilityObservable: ReplaySubject<any>;
    private sendbuiltChatUrlObservable: ReplaySubject<any>;
    private sendChatUrlObservable: ReplaySubject<any>;
    private getBladeReturnValueObservable: ReplaySubject<KeyValuePair>;
    private setBladeReturnValueObservable: ReplaySubject<any>;


    private shellSrc: string;
    private tokenObservable: ReplaySubject<string>;

    constructor(private _broadcastService: BroadcastService) {
        this.sessionId = '';

        this.startupInfoObservable = new ReplaySubject<StartupInfo>(1);
        this.tokenObservable = new ReplaySubject<string>(1);
        this.appInsightsResourceObservable = new ReplaySubject<any>(1);

        //CXP Chat messages
        this.sendChatAvailabilityObservable = new ReplaySubject<any>(1);
        this.sendbuiltChatUrlObservable = new ReplaySubject<any>(1);
        this.sendChatUrlObservable = new ReplaySubject<any>(1);

        this.getBladeReturnValueObservable = new ReplaySubject<KeyValuePair>(1);
        this.setBladeReturnValueObservable = new ReplaySubject<any>(1);

        if (this.inIFrame()) {
            this.initializeIframe();
        }
    }

    getStartupInfo(): ReplaySubject<StartupInfo> {
        return this.startupInfoObservable;
    }

    getToken(): ReplaySubject<string> {
        return this.tokenObservable;
    }

    getAppInsightsResourceInfo(): ReplaySubject<any> {
        return this.appInsightsResourceObservable;
    }

    getChatAvailability(): ReplaySubject<any> {
        return this.sendChatAvailabilityObservable;
    }

    buildChatUrl(): ReplaySubject<any> {
        return this.sendbuiltChatUrlObservable;
    }

    getChatUrl(): ReplaySubject<any> {
        return this.sendChatUrlObservable;
    }

    getBladeReturnValue(): ReplaySubject<KeyValuePair> {
        return this.getBladeReturnValueObservable;
    }

    public setBladeReturnValue(dataToSet: KeyValuePair): ReplaySubject<any> {
        if (!!dataToSet) {
            this.postMessage(Verbs.setBladeReturnValue, JSON.stringify(dataToSet));
            return this.setBladeReturnValueObservable;
        }
        else {
            this.logMessage(LogEntryLevel.Error, 'NULL data cannot be set as blade return value.');
            return null;
        }
    }



    initializeIframe(): void {
        this.shellSrc = this.getQueryStringParameter('trustedAuthority');

        window.addEventListener(Verbs.message, this.iframeReceivedMsg.bind(this), false);

        // This is a required message. It tells the shell that your iframe is ready to receive messages.
        this.postMessage(Verbs.ready, JSON.stringify({eventType: "ready"}));
        this.postMessage(Verbs.getStartupInfo, JSON.stringify({eventType: "get-startup-info"}));

        this._broadcastService.subscribe<ErrorEvent>(BroadcastEvent.Error, error => {
            if (error.details) {
                this.logMessage(LogEntryLevel.Error, error.details);
            }
        });
    }

    openBlade(bladeInfo: OpenBladeInfo, source: string) {
        this.postMessage(Verbs.openBlade, JSON.stringify(bladeInfo));
    }

    updateBladeInfo(bladeInfo: any, source: string) {
        this.postMessage("update-blade-info", JSON.stringify(bladeInfo));
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
        const actionStr = JSON.stringify({
            eventType: "log-action",
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
        console.log('[iFrame] Received validated mesg: ' + methodName, event);

        if (methodName === Verbs.sendStartupInfo) {
            const info = <StartupInfo>data;
            this.sessionId = info.sessionId;
            this.startupInfoObservable.next(info);
        } else if (methodName === Verbs.sendAppInsightsResource) {
            const aiResource = data;
            this.appInsightsResourceObservable.next(aiResource);
        } else if (methodName === Verbs.sendChatAvailability) {
            const chatAvailability = data;
            this.sendChatAvailabilityObservable.next(chatAvailability);
        } else if (methodName === Verbs.sendbuiltChatUrl) {
            const chatUrl = data;
            this.sendbuiltChatUrlObservable.next(chatUrl);
        } else if (methodName === Verbs.sendChatUrl) {
            const chatUrlAfterAvailability = data;
            this.sendChatUrlObservable.next(chatUrlAfterAvailability);
        } else if (methodName == Verbs.getBladeReturnValueResponse) {
            const getBladeReturnValueResponse = data;
            this.getBladeReturnValueObservable.next(getBladeReturnValueResponse);
        } else if (methodName == Verbs.setBladeReturnValueResponse) {
            const setBladeReturnValueResponse = data;
            this.setBladeReturnValueObservable.next(setBladeReturnValueResponse);
        } else if (methodName == Verbs.sendToken) {
            const token = data;
            this.tokenObservable.next(token);
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
