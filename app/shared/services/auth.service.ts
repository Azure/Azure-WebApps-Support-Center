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
                    token : "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyIsImtpZCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTEwMTA3MTExLCJuYmYiOjE1MTAxMDcxMTEsImV4cCI6MTUxMDExMTAxMSwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzLzJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYS9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVNRQTIvOEdBQUFBdjcyY3ZWbUhhOWRyS1BsL2g4RkZWNmJQMUhITFVteU44emhOeTYwaG1Xbz0iLCJhbXIiOlsid2lhIiwibWZhIl0sImFwcGlkIjoiMTk1MGEyNTgtMjI3Yi00ZTMxLWE5Y2YtNzE3NDk1OTQ1ZmMyIiwiYXBwaWRhY3IiOiIwIiwiZGV2aWNlaWQiOiJmMGM0NjE2OC0xZDJhLTQ1NzUtOTVjOC0wNTA2N2EzMDFkYzkiLCJlX2V4cCI6MjYyODAwLCJmYW1pbHlfbmFtZSI6Ikd1cHRhIiwiZ2l2ZW5fbmFtZSI6IlB1bmVldCIsImluX2NvcnAiOiJ0cnVlIiwiaXBhZGRyIjoiMTMxLjEwNy4xNzQuMTQiLCJuYW1lIjoiUHVuZWV0IEd1cHRhIiwib2lkIjoiMmI2YTdiZmEtZmZkYS00OTFlLWE2MDUtZWJmOWMzMGUwNGJhIiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTIxNDY3NzMwODUtOTAzMzYzMjg1LTcxOTM0NDcwNy0yMzk1MDIiLCJwdWlkIjoiMTAwMzAwMDA4MDFCQkM1OCIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6Im1kX1JjbzVwRFd0WTBRcl9qalVFdVFPNGRPejY3MzNIbmxGdlpNZ2lDQW8iLCJ0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDciLCJ1bmlxdWVfbmFtZSI6InB1bmVldGdAbWljcm9zb2Z0LmNvbSIsInVwbiI6InB1bmVldGdAbWljcm9zb2Z0LmNvbSIsInV0aSI6IkxDdk4xSkdJVTA2UlY2TXVOeFlHQUEiLCJ2ZXIiOiIxLjAifQ.rNu2iB-OjJElIODnRf38jfp7NB8vQM_oeHSpIpPaiQFIC9x1_1eOnz69Q_VTzuP2uBR3wdaITj7VZiqdeFfzzf5X3_CcWWdiw8WISqSlUgdXtdFiahknLYw4ppXH42ukfqS5W7WvgmWVLVgOvWfCKWQpAtpKvrJS4Gbxcm0_oWqeyjwV_FReviK7soyHxp9DFpOopxN-gKQ3dcscKzcJtjQrr41RB8ZAZk5Y9E_wgnpBceydj3YI6RQjgdMFb8Z8-WilhcK3uugroH67-hzOS4YXaX9CI4x95V8PdLsMFB_CFOtC_zu7B8KEyPqVfxMCwhDn_cc3N7fzgE4ZschPFw",
                    subscriptions : null,
                    resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/puneetgdemowebcamp/providers/Microsoft.Web/sites/demowebcamp"
                }
            )
        }
    }
}