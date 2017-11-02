import {Http, Headers} from '@angular/http';
import {Injectable} from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs/Rx';
import {PortalService} from './portal.service';
import {StartupInfo} from '../models/portal';

@Injectable()
export class AuthService {
    public inIFrame: boolean;
    private currentToken: string;
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

    getStartupInfo(){
        if (this.inIFrame) {
            return this._portalService.getStartupInfo();
        } else {
            return Observable.of<StartupInfo>(
                <StartupInfo>{
                    sessionId : null,
                    token : "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyIsImtpZCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTA5NjUzNjQzLCJuYmYiOjE1MDk2NTM2NDMsImV4cCI6MTUwOTY1NzU0MywiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzLzJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYS9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVNRQTIvOEdBQUFBTHN1Z0hVWGUyZi9iclJTVXR5UFY1K1NoL0UxZStESjI4OW00bkFvdVRCVT0iLCJhbXIiOlsid2lhIiwibWZhIl0sImFwcGlkIjoiMTk1MGEyNTgtMjI3Yi00ZTMxLWE5Y2YtNzE3NDk1OTQ1ZmMyIiwiYXBwaWRhY3IiOiIwIiwiZV9leHAiOjI2MjgwMCwiZmFtaWx5X25hbWUiOiJHdXB0YSIsImdpdmVuX25hbWUiOiJQdW5lZXQiLCJpbl9jb3JwIjoidHJ1ZSIsImlwYWRkciI6IjE2Ny4yMjAuMjM4LjE5IiwibmFtZSI6IlB1bmVldCBHdXB0YSIsIm9pZCI6IjJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYSIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0yMTQ2NzczMDg1LTkwMzM2MzI4NS03MTkzNDQ3MDctMjM5NTAyIiwicHVpZCI6IjEwMDMwMDAwODAxQkJDNTgiLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJzdWIiOiJtZF9SY281cERXdFkwUXJfampVRXVRTzRkT3o2NzMzSG5sRnZaTWdpQ0FvIiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidW5pcXVlX25hbWUiOiJwdW5lZXRnQG1pY3Jvc29mdC5jb20iLCJ1cG4iOiJwdW5lZXRnQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJsNnF4TDJBQnpVbS1jdl9XelRrR0FBIiwidmVyIjoiMS4wIn0.Af-BKTjcP4f1sobmyERJRC5gipC65GFcV9SClURh0c5Cd3ZWgFIiakMjBZy9zZwxnsiGEpRMdY49DiJ-dykk3xt7AXQMOd_h2_CowcEX3J_x65VTs3Gtd84S8AH_CRSwEdVQT7uNVKCWwtB_3_fm5qCEXe9wVi7iQi71iHEktgQklLuwDM70Zgcdndt3GMvd8RSpGceCWuzInumOFYicFZdnvnGUbADLkNKW5fdBwMxeG9yoN4p_w-lsvW2Df5pAArC_ISEsK3_WoPtToPZiHvpCQtVUBLRHJCVT-rhZ4kqU_ApjxozDrN8eOwRZepQ2OHvwvdw5pUtBlbro5UIBrQ",
                    subscriptions : null,
                    resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/clrprofiling/providers/Microsoft.Web/sites/clrprofiling"
                }
            )
        }
    }
}