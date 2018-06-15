import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs/Rx';
import { StartupInfo, ResourceType } from '../models/portal';
import { PortalService } from './portal.service';

@Injectable()
export class AuthService {
    public inIFrame: boolean;
    private currentToken: string;

    public resourceType: ResourceType;

    constructor(private _http: Http, private _portalService: PortalService) {
        this.inIFrame = window.parent !== window;
        this.getStartupInfo().subscribe(info => this.currentToken = info.token);
    }

    getAuthToken(): string {
        return this.currentToken;
    }

    setAuthToken(value: string): void {
        this.currentToken = value;
    }

    getStartupInfo(): Observable<StartupInfo> {
        let startupInfo: Observable<StartupInfo>;
        if (this.inIFrame) {
            startupInfo = this._portalService.getStartupInfo();
        } else {
            startupInfo = Observable.of<StartupInfo>(
                <StartupInfo>{
                    sessionId: null,
                    token: "<TOKEN>",
                    subscriptions: null,
                    resourceId: ""
                }
            )
        }

        return startupInfo.map(info => {
            if (!this.resourceType) {
                this.resourceType = info.resourceId.toLowerCase().indexOf('hostingenvironments') > 0 ? ResourceType.HostingEnvironment : ResourceType.Site;
            }

            info.resourceType = this.resourceType;
            return info;
        });
    }
}