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
                    token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjdfWnVmMXR2a3dMeFlhSFMzcTZsVWpVWUlHdyIsImtpZCI6IjdfWnVmMXR2a3dMeFlhSFMzcTZsVWpVWUlHdyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTMzOTExNTgyLCJuYmYiOjE1MzM5MTE1ODIsImV4cCI6MTUzMzkxNTQ4MiwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzLzJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYS9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVVRQXUvOElBQUFBOThOZVNyRXk0clk2aTg0VjBMdHlDQlpIOUhiak53TGhmOGZBeEtMQUZ0ZThSVytlMXczRDlUM1VVbUhlTlU3V1hwMis1N1dJOXpNazRDVlowZ0NJYWc9PSIsImFtciI6WyJyc2EiLCJtZmEiXSwiYXBwaWQiOiJhYmZhMGE3Yy1hNmI2LTQ3MzYtODMxMC01ODU1NTA4Nzg3Y2QiLCJhcHBpZGFjciI6IjIiLCJkZXZpY2VpZCI6Ijg2ZTYzZWU5LTA0MWItNDkyYi05NjRlLTRhMjE0NzI2MzgyMyIsImZhbWlseV9uYW1lIjoiR3VwdGEiLCJnaXZlbl9uYW1lIjoiUHVuZWV0IiwiaXBhZGRyIjoiMTY3LjIyMC4yMzguMTU3IiwibmFtZSI6IlB1bmVldCBHdXB0YSIsIm9pZCI6IjJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYSIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0yMTQ2NzczMDg1LTkwMzM2MzI4NS03MTkzNDQ3MDctMjM5NTAyIiwicHVpZCI6IjEwMDMwMDAwODAxQkJDNTgiLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJzdWIiOiJtZF9SY281cERXdFkwUXJfampVRXVRTzRkT3o2NzMzSG5sRnZaTWdpQ0FvIiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidW5pcXVlX25hbWUiOiJwdW5lZXRnQG1pY3Jvc29mdC5jb20iLCJ1cG4iOiJwdW5lZXRnQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJfYTFNV1plTDRFMlFoNHFTWGIwT0FBIiwidmVyIjoiMS4wIn0.tgt-m0iDmifu0YKdwZ9Jz9Ttpe7BJ8tSWyQEplOeyaJ6qYU_CV-lbQNScXhs6TQiJSTD4GUc-VJGWrtiBBV6_SM5-SjvQcDnG0xqVcGXBh9gxv_w9Eq7ZlX1ESVaCvknXM7sGgSviCw5rFysoShmifWFkWwLJzFiK4Xbp46XRU5vXYLiLOaSq4_9oCLbhxj0NZ_kTqlglkcdcx9yG69-oRjKtlAHCJji-yAUKnDOo8ivApEXRxywT87nKfx-FoGIidMEC4qsfcI2h0PR3JPtJUy3XgukvY3ytQZI2ykp4CIA--tiWn8YsGpNUKONa5tRk6VPAFyJ5vEBLqwWM7UZYw",
                    subscriptions: null,
                    //resourceId: "/subscriptions/4f42d231-1050-4386-b5ca-54cc38d11edf/resourceGroups/AnandMoodleTest/providers/Microsoft.Web/sites/AnandMoodleTest-mp"
                    resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/puneetgdemowebcamp/providers/Microsoft.Web/sites/demowebcamp"
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