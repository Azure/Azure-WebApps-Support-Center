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
                    token : "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyIsImtpZCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTEwMjAwMjczLCJuYmYiOjE1MTAyMDAyNzMsImV4cCI6MTUxMDIwNDE3MywiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzLzJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYS9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVRRQXkvOEdBQUFBUzZrSWI3d1hZMjhDaVJpODNGdEc1UHY1a2FBczdJVDMycXk5WW9mTzc5azRUd1VVcFlyTlFRSkR6THpjTnRBViIsImFtciI6WyJwd2QiLCJyc2EiLCJtZmEiXSwiYXBwaWQiOiJhYmZhMGE3Yy1hNmI2LTQ3MzYtODMxMC01ODU1NTA4Nzg3Y2QiLCJhcHBpZGFjciI6IjIiLCJkZXZpY2VpZCI6ImYwYzQ2MTY4LTFkMmEtNDU3NS05NWM4LTA1MDY3YTMwMWRjOSIsImZhbWlseV9uYW1lIjoiR3VwdGEiLCJnaXZlbl9uYW1lIjoiUHVuZWV0IiwiaW5fY29ycCI6InRydWUiLCJpcGFkZHIiOiI1MC4yMzUuMzEuMjIwIiwibmFtZSI6IlB1bmVldCBHdXB0YSIsIm9pZCI6IjJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYSIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0yMTQ2NzczMDg1LTkwMzM2MzI4NS03MTkzNDQ3MDctMjM5NTAyIiwicHVpZCI6IjEwMDMwMDAwODAxQkJDNTgiLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJzdWIiOiJtZF9SY281cERXdFkwUXJfampVRXVRTzRkT3o2NzMzSG5sRnZaTWdpQ0FvIiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidW5pcXVlX25hbWUiOiJwdW5lZXRnQG1pY3Jvc29mdC5jb20iLCJ1cG4iOiJwdW5lZXRnQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJ3Zm1kbTBVWWwwYXRNeTBVbVN3WEFBIiwidmVyIjoiMS4wIn0.G53HF_Z-lrlyZVQcuDyniRoo4eha9XFV6OukdRPXIzq_ZeavxKAVLL2yci5l0GiQ-AxRhU9rUURvK2j-J-wbqCg3vdJmF5scqmZZ3tvw7UOMtD2HjKVyeHgCsnTRb6VEsAw9t5NxoWFtLnfcruMi35Q8rDg2MtVWzNhwK1xjOEsKe50mmolKtphQtN2j2G0oBPFip8avwvFsDyAcs10LlhA7dFk4J6yKf5PaDSF_3mHNq-pJdjcj6fwOxtuGdlliBopNK6tFF8fBGDcF0Tn7ThN_KeDPolUBMCL8-B03T6GVhkgP65GPw9O6k812irjK9wT7jPk2rfCL-aYJYAMRgQ",
                    subscriptions : null,
                    resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/puneetgdemowebcamp/providers/Microsoft.Web/sites/demowebcamp"
                }
            )
        }
    }
}