import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable ,  of } from 'rxjs'
import { StartupInfo, ResourceType } from '../../shared/models/portal';
import { PortalService } from './portal.service';
import { map } from 'rxjs/operators';

@Injectable()
export class AuthService {
    public inIFrame: boolean;
    private currentToken: string;

    public resourceType: ResourceType;

    private localStartUpInfo: StartupInfo = <StartupInfo>{
        sessionId: '',
        token: '',
        subscriptions: null,
        resourceId: '',
        workflowId: '',
        supportTopicId: ''
    }

    public get hasLocalStartupInfo() {
        return this.localStartUpInfo && this.localStartUpInfo.token && this.localStartUpInfo.resourceId;
    }

    constructor(private _http: Http, private _portalService: PortalService) {
        this.inIFrame = window.parent !== window;
    }

    getAuthToken(): string {
        return this.currentToken;
    }

    setAuthToken(value: string): void {
        this.currentToken = value;
    }

    setStartupInfo(token: string, resourceId: string) {
        this.localStartUpInfo.token = token;
        this.localStartUpInfo.resourceId = resourceId;
        this.currentToken = token;
    }

    getStartupInfo(): Observable<StartupInfo> {
        let startupInfo: Observable<StartupInfo>;
        if (this.inIFrame) {
            startupInfo = this._portalService.getStartupInfo();
        } else {
            if (this.localStartUpInfo.token.startsWith('Bearer ')) {
                this.localStartUpInfo.token = this.localStartUpInfo.token.replace('Bearer ', '');
            }
            startupInfo = of<StartupInfo>(this.localStartUpInfo)
        }

        return startupInfo.pipe(
            map((info: StartupInfo) => {
                if (info && info.resourceId) {
                    info.resourceId = info.resourceId.toLowerCase();

                    this.currentToken = info.token;

                    if (!this.resourceType) {
                        this.resourceType = info.resourceId.toLowerCase().indexOf('hostingenvironments') > 0 ? ResourceType.HostingEnvironment : ResourceType.Site;
                    }

                    info.resourceType = this.resourceType;
                    return info;
                }
            }));
    }
}