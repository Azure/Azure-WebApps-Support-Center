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
        token: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Imk2bEdrM0ZaenhSY1ViMkMzbkVRN3N5SEpsWSIsImtpZCI6Imk2bEdrM0ZaenhSY1ViMkMzbkVRN3N5SEpsWSJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTM2OTU5ODQxLCJuYmYiOjE1MzY5NTk4NDEsImV4cCI6MTUzNjk2Mzc0MSwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzL2IwY2Q2OTExLWRmNTAtNGQyZS05MGQ0LThiMzQ0ZjRmOGQyZC9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVVRQXUvOElBQUFBSWx0UUkwSVV2NEM5UWN0T1NsZmdGMU8vdFgySVA3QTlmR0NieHBkSEIzZ2dLSUtlVEhaY3hHdktJanpRWmtaWTJtWkpmdU5kdC9nZnlRUy9HajQ5NEE9PSIsImFtciI6WyJyc2EiLCJtZmEiXSwiYXBwaWQiOiIxOTUwYTI1OC0yMjdiLTRlMzEtYTljZi03MTc0OTU5NDVmYzIiLCJhcHBpZGFjciI6IjAiLCJkZXZpY2VpZCI6IjAxODMwZGYxLWU3M2MtNDg5ZS04NDlhLTdlOTllNzRhZjI2YyIsImVfZXhwIjoyNjI4MDAsImZhbWlseV9uYW1lIjoiRXJuc3QiLCJnaXZlbl9uYW1lIjoiU3RldmUiLCJpcGFkZHIiOiIxNjcuMjIwLjIuMTQ1IiwibmFtZSI6IlN0ZXZlIEVybnN0Iiwib2lkIjoiYjBjZDY5MTEtZGY1MC00ZDJlLTkwZDQtOGIzNDRmNGY4ZDJkIiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTIxMjc1MjExODQtMTYwNDAxMjkyMC0xODg3OTI3NTI3LTE2NDQ3ODIzIiwicHVpZCI6IjEwMDNCRkZEOEUxNTlBNTEiLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJzdWIiOiJYam9Tdzg3YWprTVN2MGx4TzBSMFNMa09hc0ZpTzNQQ3lUam1CX2s5akZnIiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidW5pcXVlX25hbWUiOiJzdGVybnNAbWljcm9zb2Z0LmNvbSIsInVwbiI6InN0ZXJuc0BtaWNyb3NvZnQuY29tIiwidXRpIjoiS1htSGdIMXgxa3E3NVZEZ2d3b0NBQSIsInZlciI6IjEuMCJ9.Ispf-rdmJgI9su35wjfJjLDc8ugWQQsjmMyP_QL1csXKWlwYZ3jEt_fQjXQgKvmFsiJ2m6Qogxig0i6cbD7JF3qqnBlrRWIgf9SIQfhWGfMV6RMagJZt4t4YQsfbhJGidpzRN6-p8fljaLk7RZVJcScgUAenHMPWkLdA5htnC9XHGpDgGi5cEaopGbucP2w1uvKGiG8w36Vlfx9y-PqNdO73Uj90GjK316OBEyKhzNQfG2nGta9Z402cCLYhJHYke6uCBeOIdYMJALAEoLHnJNdTJqaIi3ADek2JHJSxqvWdQ9NOH5IzEbki43sfcWdcILNeKpb0OygRpMEXu6BRMg",
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