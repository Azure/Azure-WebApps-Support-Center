import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs/Rx';
import { StartupInfo, ResourceType } from '../models/portal';
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
                    token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlRpb0d5d3dsaHZkRmJYWjgxM1dwUGF5OUFsVSIsImtpZCI6IlRpb0d5d3dsaHZkRmJYWjgxM1dwUGF5OUFsVSJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTI5MDg4MDQyLCJuYmYiOjE1MjkwODgwNDIsImV4cCI6MTUyOTA5MTk0MiwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzL2IwY2Q2OTExLWRmNTAtNGQyZS05MGQ0LThiMzQ0ZjRmOGQyZC9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVVRQXUvOEhBQUFBV21INnlUV1p2OGRrb0xlYno2dWxQVXU2aklxdDRLaGltVHQxbk1HYitxNXlvSHVLdXN6OUt2Wnpxck9hUUZMa2hPY0YxYlZXcDNiWE9jZXJSZHBwSGc9PSIsImFtciI6WyJyc2EiLCJtZmEiXSwiYXBwaWQiOiIxOTUwYTI1OC0yMjdiLTRlMzEtYTljZi03MTc0OTU5NDVmYzIiLCJhcHBpZGFjciI6IjAiLCJkZXZpY2VpZCI6IjAxODMwZGYxLWU3M2MtNDg5ZS04NDlhLTdlOTllNzRhZjI2YyIsImVfZXhwIjoyNjI4MDAsImZhbWlseV9uYW1lIjoiRXJuc3QiLCJnaXZlbl9uYW1lIjoiU3RldmUiLCJpcGFkZHIiOiIxMzEuMTA3LjE2MC4zNCIsIm5hbWUiOiJTdGV2ZSBFcm5zdCIsIm9pZCI6ImIwY2Q2OTExLWRmNTAtNGQyZS05MGQ0LThiMzQ0ZjRmOGQyZCIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0yMTI3NTIxMTg0LTE2MDQwMTI5MjAtMTg4NzkyNzUyNy0xNjQ0NzgyMyIsInB1aWQiOiIxMDAzQkZGRDhFMTU5QTUxIiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic3ViIjoiWGpvU3c4N2Fqa01TdjBseE8wUjBTTGtPYXNGaU8zUEN5VGptQl9rOWpGZyIsInRpZCI6IjcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0NyIsInVuaXF1ZV9uYW1lIjoic3Rlcm5zQG1pY3Jvc29mdC5jb20iLCJ1cG4iOiJzdGVybnNAbWljcm9zb2Z0LmNvbSIsInV0aSI6ImNIUXRONk1xbVVPOGRyd1JYNk1CQUEiLCJ2ZXIiOiIxLjAifQ.ZMuR9HUimOUC_mq6Bsxijiwq888lisB0rSecSVZYQnELZF4lBJp_2K6hee12QKChRWc0_iGUR2nhy7ScNmVJ5CyFkPiEsobVfHVYZeqOdJ9v3ch23g9epPbUYyzTVyr0pcab8a8MgqNUVhK-kE28PPADQMmYh82AfnAzue8qR9aWkYd3oT6M0WIWhtDvZsVBfBfonDPQLPGGK6U2a8on7KfVKOEYx68TUGi3z_hPuNUlRnEbfSVwichgWoWQf6fQdHiM1wfKCHdjwTAUMgJYtZBbROURT6AF8N70hlJ2yv3fngOKdQH18ttP53D5x0UplVtw98WKmLr2MAyUQtIcNg",
                    subscriptions: null,
                    //resourceId: "/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourceGroups/netpractice/providers/Microsoft.Web/sites/netpractice"
                    resourceId: "/subscriptions/0542bd5e-4c49-4e12-8976-8a3c92b0e05f/resourceGroups/hawforase-rg/providers/Microsoft.Web/hostingEnvironments/hawforase"
                }
            )
        }

        return startupInfo.map(info => {
            if (!this.resourceType) {
                this.resourceType = info.resourceId.toLowerCase().indexOf('hostingenvironments') > 0 ? ResourceType.HostingEnvironment : ResourceType.Site;
            }

            info.resourceType = this.resourceType;
            return info;
        });
    }
}