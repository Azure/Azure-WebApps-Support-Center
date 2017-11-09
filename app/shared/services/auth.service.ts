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
                    token : "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyIsImtpZCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTEwMTk1MzAzLCJuYmYiOjE1MTAxOTUzMDMsImV4cCI6MTUxMDE5OTIwMywiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzLzJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYS9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVRRQXkvOEdBQUFBcWdBUGdHWDg3cEpUNlNIM3YvTkkvaXZzOFJsaWJleEZBZXluYUVmaStROXZhMU50QWh5NDVLNHNmSmlYT2NxRCIsImFtciI6WyJwd2QiLCJyc2EiLCJtZmEiXSwiYXBwaWQiOiJhYmZhMGE3Yy1hNmI2LTQ3MzYtODMxMC01ODU1NTA4Nzg3Y2QiLCJhcHBpZGFjciI6IjIiLCJkZXZpY2VpZCI6ImYwYzQ2MTY4LTFkMmEtNDU3NS05NWM4LTA1MDY3YTMwMWRjOSIsImZhbWlseV9uYW1lIjoiR3VwdGEiLCJnaXZlbl9uYW1lIjoiUHVuZWV0IiwiaW5fY29ycCI6InRydWUiLCJpcGFkZHIiOiIxMzEuMTA3LjE1OS4yNiIsIm5hbWUiOiJQdW5lZXQgR3VwdGEiLCJvaWQiOiIyYjZhN2JmYS1mZmRhLTQ5MWUtYTYwNS1lYmY5YzMwZTA0YmEiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMjE0Njc3MzA4NS05MDMzNjMyODUtNzE5MzQ0NzA3LTIzOTUwMiIsInB1aWQiOiIxMDAzMDAwMDgwMUJCQzU4Iiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic3ViIjoibWRfUmNvNXBEV3RZMFFyX2pqVUV1UU80ZE96NjczM0hubEZ2Wk1naUNBbyIsInRpZCI6IjcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0NyIsInVuaXF1ZV9uYW1lIjoicHVuZWV0Z0BtaWNyb3NvZnQuY29tIiwidXBuIjoicHVuZWV0Z0BtaWNyb3NvZnQuY29tIiwidXRpIjoibVl0RnM2aGF5a3FTUTk1MmtEVVZBQSIsInZlciI6IjEuMCJ9.sOwHxbkcquZHJkF5IOwQqH8bj8l3JA3XfjILGhoga6nnf6c_Cm4yxSPAjiF4ES2WBRvgDm8GIMk-FNOttTqUFL7iz7HuGgPw8sPbSF3_3CCFuDm37kUsHY8ocgSUW47mzim57TGrwMi7jVXvGHM2UZ1NU7WEDP96vlxfM8pQRU_XAysMEDZkqscP5asAr6lvNnI7vPnFTSXND9rO4v5J_QuKqvRVBhY2n9345EoZLjbuv09aV7Zz3iczpVfiKjFaB7sNrlGmufDwRqM78UPs88VhsjNVRWxAi8hwfk7TA_-4EHKRYuIcB26v-1S1mdIg2JEFOysOFW1pgGuShuYSUg",
                    subscriptions : null,
                    resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/puneetgdemowebcamp/providers/Microsoft.Web/sites/demowebcamp"
                }
            )
        }
    }
}