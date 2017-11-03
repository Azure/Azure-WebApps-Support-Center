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
                    token : "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyIsImtpZCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTA5NzA3OTE2LCJuYmYiOjE1MDk3MDc5MTYsImV4cCI6MTUwOTcxMTgxNiwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzLzJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYS9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVNRQTIvOEdBQUFBbE55MWxiMVNGNVFiTkx2VWhsVGlSaGIxM2hlcG9MQnpFOVhHV2FOam9FST0iLCJhbXIiOlsid2lhIiwibWZhIl0sImFwcGlkIjoiMTk1MGEyNTgtMjI3Yi00ZTMxLWE5Y2YtNzE3NDk1OTQ1ZmMyIiwiYXBwaWRhY3IiOiIwIiwiZV9leHAiOjI2MjgwMCwiZmFtaWx5X25hbWUiOiJHdXB0YSIsImdpdmVuX25hbWUiOiJQdW5lZXQiLCJpbl9jb3JwIjoidHJ1ZSIsImlwYWRkciI6IjE2Ny4yMjAuMjM4LjE5IiwibmFtZSI6IlB1bmVldCBHdXB0YSIsIm9pZCI6IjJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYSIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0yMTQ2NzczMDg1LTkwMzM2MzI4NS03MTkzNDQ3MDctMjM5NTAyIiwicHVpZCI6IjEwMDMwMDAwODAxQkJDNTgiLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJzdWIiOiJtZF9SY281cERXdFkwUXJfampVRXVRTzRkT3o2NzMzSG5sRnZaTWdpQ0FvIiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidW5pcXVlX25hbWUiOiJwdW5lZXRnQG1pY3Jvc29mdC5jb20iLCJ1cG4iOiJwdW5lZXRnQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJHWGRZSjQzWDQwNmxZZHhzY1IwREFBIiwidmVyIjoiMS4wIn0.rPh4k_m4xZNrS5nShlWVLxFijq6rUslcsH_guTpJIDpqDd7Ozgb6eganrT2USG3O_ZbTahQmG8w_FtzBDeInoFi3E7jkpY6YqSMVlS7oDfDOD8OQFIJ83pnYQXhvoed2jWhS9UxPtlxLNhNVIRJjTkJfyJIiFqCMMc_Ce24a0oOSDi7pagbujqt-VVUxPpWhhtUDlispBwfMvEnZgJ6_cJWcGhiN2aD3lBaOfDcyVAXjORAV13B8DCsnVPnYoHZqkx3sERVsywi25n9lX3H7DJ0MnZvThPTKKRIaUJGoui-ddCMez94ii5i-Pw-2MAK_fGjMn8Z9_tJDIQ52gc5Gxw",
                    subscriptions : null,
                    resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/clrprofiling/providers/Microsoft.Web/sites/clrprofiling"
                }
            )
        }
    }
}