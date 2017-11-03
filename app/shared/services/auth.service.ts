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
                    token : "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyIsImtpZCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTA5NzEzNjgwLCJuYmYiOjE1MDk3MTM2ODAsImV4cCI6MTUwOTcxNzU4MCwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzLzJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYS9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiWTJOZ1lKQlpXTEM5UlhKaGw1MlRRRzlYdTMzTGkzem11N0w4TjNhRmNuRDUvK3BmL1JnQSIsImFtciI6WyJ3aWEiLCJtZmEiXSwiYXBwaWQiOiIxOTUwYTI1OC0yMjdiLTRlMzEtYTljZi03MTc0OTU5NDVmYzIiLCJhcHBpZGFjciI6IjAiLCJlX2V4cCI6MjYyODAwLCJmYW1pbHlfbmFtZSI6Ikd1cHRhIiwiZ2l2ZW5fbmFtZSI6IlB1bmVldCIsImluX2NvcnAiOiJ0cnVlIiwiaXBhZGRyIjoiMTY3LjIyMC4yMzguMTkiLCJuYW1lIjoiUHVuZWV0IEd1cHRhIiwib2lkIjoiMmI2YTdiZmEtZmZkYS00OTFlLWE2MDUtZWJmOWMzMGUwNGJhIiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTIxNDY3NzMwODUtOTAzMzYzMjg1LTcxOTM0NDcwNy0yMzk1MDIiLCJwdWlkIjoiMTAwMzAwMDA4MDFCQkM1OCIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6Im1kX1JjbzVwRFd0WTBRcl9qalVFdVFPNGRPejY3MzNIbmxGdlpNZ2lDQW8iLCJ0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDciLCJ1bmlxdWVfbmFtZSI6InB1bmVldGdAbWljcm9zb2Z0LmNvbSIsInVwbiI6InB1bmVldGdAbWljcm9zb2Z0LmNvbSIsInV0aSI6IkNHdzE5ZnE5QTAyc1FFdXJiQU1EQUEiLCJ2ZXIiOiIxLjAifQ.Zy0GZ1ZoGsDjP4LRHNcRrJAqIfkgySA_WZVz4hsoeFXRpv_WV89i_zbv_xMSm_ecMpV8vWyPsb_AV-ap_E-OoAkp3ottwdyqvYhwZo3NdDHfEh0qWqoCsc5MmSwsYAh6b-mZoUeOAR7594Chh2mFAiFplmoXaRzuhJVHV9bvvqURnvzTQWPZRf8K00DeuWmIiEdzgnOpw-5b5BTOLrwBLbNt_DulMU6TnX8onFPfnkVlGJOvAilkAj0P-jHg5-9liwf__NqJJzgb3JUz9wIXWXwVAPnQkYOVNNc3NyGP29ptksePqyycrHzoGpnK5yuHVZUZe7TOoLFZrrH-OwE8Pg",
                    subscriptions : null,
                    resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/clrprofiling/providers/Microsoft.Web/sites/clrprofiling"
                }
            )
        }
    }
}