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
                    token : "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyIsImtpZCI6IjJLVmN1enFBaWRPTHFXU2FvbDd3Z0ZSR0NZbyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTEwMDM2NjM2LCJuYmYiOjE1MTAwMzY2MzYsImV4cCI6MTUxMDA0MDUzNiwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzLzJiNmE3YmZhLWZmZGEtNDkxZS1hNjA1LWViZjljMzBlMDRiYS9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVNRQTIvOEdBQUFBQ0VMa2daY3dLR3k4czdJTUlkeTdQTkFIeUNhZFkyVGlBVjY5c2VCT09mQT0iLCJhbXIiOlsicnNhIiwibWZhIl0sImFwcGlkIjoiMTk1MGEyNTgtMjI3Yi00ZTMxLWE5Y2YtNzE3NDk1OTQ1ZmMyIiwiYXBwaWRhY3IiOiIwIiwiZGV2aWNlaWQiOiJmMGM0NjE2OC0xZDJhLTQ1NzUtOTVjOC0wNTA2N2EzMDFkYzkiLCJlX2V4cCI6MjYyODAwLCJmYW1pbHlfbmFtZSI6Ikd1cHRhIiwiZ2l2ZW5fbmFtZSI6IlB1bmVldCIsImluX2NvcnAiOiJ0cnVlIiwiaXBhZGRyIjoiNTAuMjM1LjMxLjIyMCIsIm5hbWUiOiJQdW5lZXQgR3VwdGEiLCJvaWQiOiIyYjZhN2JmYS1mZmRhLTQ5MWUtYTYwNS1lYmY5YzMwZTA0YmEiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMjE0Njc3MzA4NS05MDMzNjMyODUtNzE5MzQ0NzA3LTIzOTUwMiIsInB1aWQiOiIxMDAzMDAwMDgwMUJCQzU4Iiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic3ViIjoibWRfUmNvNXBEV3RZMFFyX2pqVUV1UU80ZE96NjczM0hubEZ2Wk1naUNBbyIsInRpZCI6IjcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0NyIsInVuaXF1ZV9uYW1lIjoicHVuZWV0Z0BtaWNyb3NvZnQuY29tIiwidXBuIjoicHVuZWV0Z0BtaWNyb3NvZnQuY29tIiwidXRpIjoiRGpURnRteElPMDYzRHBKQXpyTUlBQSIsInZlciI6IjEuMCJ9.ublf2V17mBH0DRIXBataA8zUWzBvZ_tm1Awl9OLxLMFsDPNdQNZu28N6_HtWSkQhFsO8UB6CGG2T4HOkAimNrCFJ84aQ93dJzqC2ku4WjeM9tHbzWCnaLfc6OivLshT-yj31DXo_NnV_a7xQl2sX3lhP3qbCUfmOltrS5OQCykbkjN-ahoMOIsmYIjyDmfovWmpNPifsEc6cigvX-YK8D2APrq-u9J7IGj7i_42tS05fVQRxw0OcLBEWV7KpNbSb5zbXCKhgFtihs7uE2j6-n0U7Itk9a25xH1Buu0QTAv98hX5PMDyPGhi_tGP2iQbw8jrltEpWyETKgbDKllAZfA",
                    subscriptions : null,
                    resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/clrprofiling/providers/Microsoft.Web/sites/clrprofiling"
                }
            )
        }
    }
}