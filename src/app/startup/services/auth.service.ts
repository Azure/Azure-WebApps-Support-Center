import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs/Rx';
import { StartupInfo, ResourceType } from '../../shared/models/portal';
import { PortalService } from './portal.service';

@Injectable()
export class AuthService {
    public inIFrame: boolean;
    private currentToken: string;

    public resourceType: ResourceType;

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

    getStartupInfo(): Observable<StartupInfo> {
        let startupInfo: Observable<StartupInfo>;
        if (this.inIFrame) {
            startupInfo = this._portalService.getStartupInfo();
        } else {
            startupInfo = Observable.of<StartupInfo>(
                <StartupInfo>{
                    sessionId: null,
                    token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjdfWnVmMXR2a3dMeFlhSFMzcTZsVWpVWUlHdyIsImtpZCI6IjdfWnVmMXR2a3dMeFlhSFMzcTZsVWpVWUlHdyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTMyNzMwNTkyLCJuYmYiOjE1MzI3MzA1OTIsImV4cCI6MTUzMjczNDQ5MiwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzL2IwY2Q2OTExLWRmNTAtNGQyZS05MGQ0LThiMzQ0ZjRmOGQyZC9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVVRQXUvOElBQUFBeHdxQ1NHZHB5WHNmL0YycFZwTEdYZVo3UE9kWVJZUmRaYiszK2NSQ0ttL2hXZ0s1b3NaK0NMQkRCUzVtMHNLclM5WlExNlRWQVFPcWZGR2llUHlqRkE9PSIsImFtciI6WyJyc2EiLCJtZmEiXSwiYXBwaWQiOiIxOTUwYTI1OC0yMjdiLTRlMzEtYTljZi03MTc0OTU5NDVmYzIiLCJhcHBpZGFjciI6IjAiLCJkZXZpY2VpZCI6IjAxODMwZGYxLWU3M2MtNDg5ZS04NDlhLTdlOTllNzRhZjI2YyIsImVfZXhwIjoyNjI4MDAsImZhbWlseV9uYW1lIjoiRXJuc3QiLCJnaXZlbl9uYW1lIjoiU3RldmUiLCJpcGFkZHIiOiIxMzEuMTA3LjE2MC4zNCIsIm5hbWUiOiJTdGV2ZSBFcm5zdCIsIm9pZCI6ImIwY2Q2OTExLWRmNTAtNGQyZS05MGQ0LThiMzQ0ZjRmOGQyZCIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0yMTI3NTIxMTg0LTE2MDQwMTI5MjAtMTg4NzkyNzUyNy0xNjQ0NzgyMyIsInB1aWQiOiIxMDAzQkZGRDhFMTU5QTUxIiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic3ViIjoiWGpvU3c4N2Fqa01TdjBseE8wUjBTTGtPYXNGaU8zUEN5VGptQl9rOWpGZyIsInRpZCI6IjcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0NyIsInVuaXF1ZV9uYW1lIjoic3Rlcm5zQG1pY3Jvc29mdC5jb20iLCJ1cG4iOiJzdGVybnNAbWljcm9zb2Z0LmNvbSIsInV0aSI6IkJCNlB0ejFfdVVtX2F1TWtDMW9CQUEiLCJ2ZXIiOiIxLjAifQ.jXlHuw55tCVF-Z5_cvCl5K_QknGwLKpYwPvuCG_A5l_jChYtIRNNRcNDOi7s_qXuKkpxlvNcanaVPsXvLp-8J7Fv8p2xyafshuktYrCahYmCKOo7NUEd-U12qdWHZsrxsiYhwQH-ZECgN4KNFjNiAz64Bq_KnrotZAmA6EnAyPj-4jsvuDeO-9iEtpdPD5WVnAKgXcWP29MyE4qrvBhHyjThZJ4PMNgcC9OvcIt1T-xOY3uTs8SXizrgmFctNGkfaydd7iAHpPIdHtKYjWSiG4WnywOSfvr7_Zy10_xrhP-KGX9nMQ2R2vE38HcIHDhMczClv1c5stoAzinx5DbJdg",
                    subscriptions: null,
                    resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/netpractice/providers/Microsoft.Web/sites/netpractice"
                }
            )
        }

        return startupInfo.map(info => {
            info.resourceId = info.resourceId.toLowerCase();

            if (!this.resourceType) {
                this.resourceType = info.resourceId.toLowerCase().indexOf('hostingenvironments') > 0 ? ResourceType.HostingEnvironment : ResourceType.Site;
            }

            info.resourceType = this.resourceType;
            return info;
        });
    }
}