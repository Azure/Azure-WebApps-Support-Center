import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs/Rx';
import { StartupInfo, ResourceType } from '../../shared/models/portal';
import { PortalService } from './portal.service';

@Injectable()
export class AuthService {
    public inIFrame: boolean;
    private currentToken: string;

    public resourceType: ResourceType;

    private localStartUpInfo: StartupInfo = <StartupInfo>{
        sessionId: null,
        //token: null,
        token: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Imk2bEdrM0ZaenhSY1ViMkMzbkVRN3N5SEpsWSIsImtpZCI6Imk2bEdrM0ZaenhSY1ViMkMzbkVRN3N5SEpsWSJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTM3Mzg5MjU3LCJuYmYiOjE1MzczODkyNTcsImV4cCI6MTUzNzM5MzE1NywiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzL2IwY2Q2OTExLWRmNTAtNGQyZS05MGQ0LThiMzQ0ZjRmOGQyZC9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVVRQXUvOElBQUFBS1pwNUYyS0lNbXJ4eU93RG0wUklvME8yMTQ1Sno4bnlwSmFCOUIwc0FBdFhpUE44WWp4dWVFdzJCYjRHcmxtT1lCeWVUeGU4VDhkcStsU0IrSkdxbmc9PSIsImFtciI6WyJyc2EiLCJtZmEiXSwiYXBwaWQiOiIxOTUwYTI1OC0yMjdiLTRlMzEtYTljZi03MTc0OTU5NDVmYzIiLCJhcHBpZGFjciI6IjAiLCJkZXZpY2VpZCI6IjAxODMwZGYxLWU3M2MtNDg5ZS04NDlhLTdlOTllNzRhZjI2YyIsImVfZXhwIjoyNjI4MDAsImZhbWlseV9uYW1lIjoiRXJuc3QiLCJnaXZlbl9uYW1lIjoiU3RldmUiLCJpcGFkZHIiOiIxMzEuMTA3LjE0Ny4xNDUiLCJuYW1lIjoiU3RldmUgRXJuc3QiLCJvaWQiOiJiMGNkNjkxMS1kZjUwLTRkMmUtOTBkNC04YjM0NGY0ZjhkMmQiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMjEyNzUyMTE4NC0xNjA0MDEyOTIwLTE4ODc5Mjc1MjctMTY0NDc4MjMiLCJwdWlkIjoiMTAwM0JGRkQ4RTE1OUE1MSIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6Ilhqb1N3ODdhamtNU3YwbHhPMFIwU0xrT2FzRmlPM1BDeVRqbUJfazlqRmciLCJ0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDciLCJ1bmlxdWVfbmFtZSI6InN0ZXJuc0BtaWNyb3NvZnQuY29tIiwidXBuIjoic3Rlcm5zQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJFbmdkSlkxN1UwZXpLMlZOcDJNRkFBIiwidmVyIjoiMS4wIn0.STrgW2DPAPSq-laBgWIqNfNLZe0RvE3rFirKStuKb9d7I6n2YbCaIXKE6LKtQQMVvaBavNr4DJAVX_utLAZn-8_NJALOVYVaJGpvRwUMQK5Rgo7Ls0RG6ztHg5hqQ-xOztI5sCIDdVt0Vxe0xrTkS81GtViXkLYVTG6Naa0tj3hQUB5-gxRgDL4hTW2XH5F4TRhM25dRYnLbNfZtSIIwaMb7wRdHP3KmUdCGktOB5WlL6CAHlTuR1tpCqKiTXJTs4c5rhGweKE5yhROWoCQI8JfE5bPGXAkpDyLZur-3DqAN-VDKdswl92CJNuqpZN7gGXg8rgkSc5BztGDjMtr8Lg",
        subscriptions: null,
        resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/netpractice/providers/Microsoft.Web/sites/netpractice",
        //supportTopicId: '32542208',
        //pesId: '14748'
        //resourceId: "/subscriptions/88c8fe3d-1993-4fac-8e44-0f3232cc60ce/resourceGroups/alkarcheBigBoxofBrokenFunctions/providers/Microsoft.Web/sites/AlkarcheOutOfMemory"
        //resourceId: '/subscriptions/4adb32ad-8327-4cbb-b775-b84b4465bb38/resourceGroups/mikono-beta/providers/Microsoft.Web/sites/linuxbadportapp'
        //resourceId: '/subscriptions/0542bd5e-4c49-4e12-8976-8a3c92b0e05f/resourceGroups/hawforase-rg/providers/Microsoft.Web/hostingEnvironments/hawforase'
        //resourceId: null
    }

    public get hasLocalStartupInfo() {
        return this.localStartUpInfo && this.localStartUpInfo.token && this.localStartUpInfo.resourceId;
    }

    constructor(private _http: Http, private _portalService: PortalService) {
        this.inIFrame = window.parent !== window;
        // this.getStartupInfo().subscribe(info => {
        //     if (info && info.token) {
        //         this.currentToken = info.token
        //     }
        // });

    }

    getAuthToken(): string {
        return this.currentToken;
    }

    setAuthToken(value: string): void {
        this.currentToken = value;
    }

    setStartupInfo(token: string, resourceId: string) {
        this.localStartUpInfo.token = token;
        this.localStartUpInfo.resourceId = resourceId;
        this.currentToken = token;
    }

    getStartupInfo(): Observable<StartupInfo> {
        let startupInfo: Observable<StartupInfo>;
        if (this.inIFrame) {
            startupInfo = this._portalService.getStartupInfo();
        } else {
            if (this.localStartUpInfo.token.startsWith('Bearer ')) {
                this.localStartUpInfo.token = this.localStartUpInfo.token.replace('Bearer ', '');
            }
            startupInfo = Observable.of(this.localStartUpInfo)
        }

        return startupInfo.map(info => {
            if (info && info.resourceId) {
                info.resourceId = info.resourceId.toLowerCase();

                this.currentToken = info.token;

                if (!this.resourceType) {
                    this.resourceType = info.resourceId.toLowerCase().indexOf('hostingenvironments') > 0 ? ResourceType.HostingEnvironment : ResourceType.Site;
                }

                info.resourceType = this.resourceType;
                return info;
            }
        });
    }
}