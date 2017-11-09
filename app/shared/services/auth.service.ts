import {Http, Headers} from '@angular/http';
import {Injectable} from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs/Rx';
import {PortalService} from './portal.service';
import {StartupInfo} from '../models/portal';

@Injectable()
export class AuthService {
    public inIFrame: boolean;
    private currentToken: string;

    public static newFeatureEnabled: boolean = false;
    
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
                    token : "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyIsImtpZCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTEwMjQ5NjM3LCJuYmYiOjE1MTAyNDk2MzcsImV4cCI6MTUxMDI1MzUzNywiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzLzJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYS9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVRRQXkvOEdBQUFBN2VZdU5kbXF5T2NNendvQ3Q5ZFo5MzZDSUhGUzVsU1JTVVNIaG1jaDUySi9paDRxVk9qSWxLbVY4SVkvYXMxdiIsImFtciI6WyJwd2QiLCJyc2EiLCJtZmEiXSwiYXBwaWQiOiJhYmZhMGE3Yy1hNmI2LTQ3MzYtODMxMC01ODU1NTA4Nzg3Y2QiLCJhcHBpZGFjciI6IjIiLCJkZXZpY2VpZCI6ImYwYzQ2MTY4LTFkMmEtNDU3NS05NWM4LTA1MDY3YTMwMWRjOSIsImZhbWlseV9uYW1lIjoiR3VwdGEiLCJnaXZlbl9uYW1lIjoiUHVuZWV0IiwiaW5fY29ycCI6InRydWUiLCJpcGFkZHIiOiIxMzEuMTA3LjE1OS4xODMiLCJuYW1lIjoiUHVuZWV0IEd1cHRhIiwib2lkIjoiMmI2YTdiZmEtZmZkYS00OTFlLWE2MDUtZWJmOWMzMGUwNGJhIiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTIxNDY3NzMwODUtOTAzMzYzMjg1LTcxOTM0NDcwNy0yMzk1MDIiLCJwdWlkIjoiMTAwMzAwMDA4MDFCQkM1OCIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6Im1kX1JjbzVwRFd0WTBRcl9qalVFdVFPNGRPejY3MzNIbmxGdlpNZ2lDQW8iLCJ0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDciLCJ1bmlxdWVfbmFtZSI6InB1bmVldGdAbWljcm9zb2Z0LmNvbSIsInVwbiI6InB1bmVldGdAbWljcm9zb2Z0LmNvbSIsInV0aSI6IkRMVVlPTnB3ajAyT0hwTG5XOGdoQUEiLCJ2ZXIiOiIxLjAifQ.rncj3SjfdJMfi83WYxHVjuZ-JVHwa3thXBZZJhj114GuSsOZbraWFcuOusp0966lQEjswEFE1l81lHSDeYiz-ptkbKZCSDaMtOfUt6GUFJy5aWr1eufujxWlrrjMzy-BlrXAU_JzCbsNAKrMO6NHm_3X3qHhKPrKT1VVgaSXaiLTdue5jp_0V4FXQmqB6wbJYQYLiPKOnK9mkDhmvIJxPGXV0WncAb-rbtS7KwJPgzi-a7haRwZK6W1DCJAl2r4Q1N_L0OsT_OB01zBnWibybFKHW50ZYVOFP8_ebFpuL10kGjejVnECxCQYzX_BlzRzLdb9wG2NeMBgTeEKa7dWNA",
                    subscriptions : null,
                    resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/puneetgdemowebcamp/providers/Microsoft.Web/sites/demowebcamp"
                }
            )
        }
    }
}