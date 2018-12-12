import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable ,  of } from 'rxjs'
import { StartupInfo, ResourceType } from '../../shared/models/portal';
import { PortalService } from './portal.service';
import { map } from 'rxjs/operators';

@Injectable()
export class AuthService {
    public inIFrame: boolean;
    private currentToken: string;

    public resourceType: ResourceType;

    private localStartUpInfo: StartupInfo = <StartupInfo>{
        sessionId: null,
        token: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Im5iQ3dXMTF3M1hrQi14VWFYd0tSU0xqTUhHUSIsImtpZCI6Im5iQ3dXMTF3M1hrQi14VWFYd0tSU0xqTUhHUSJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNTQ0NjQwMDI4LCJuYmYiOjE1NDQ2NDAwMjgsImV4cCI6MTU0NDY0MzkyOCwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzL2IwY2Q2OTExLWRmNTAtNGQyZS05MGQ0LThiMzQ0ZjRmOGQyZC9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVZRQXEvOEpBQUFBRlZ1U1F5c2dZdG5iVDd5R3E5QnFKbE5tUGZUcnlmcllldmpMQjIxMTJrM096UWg5bnNTcCtqQ1Y1OTN4dmFHL0h3OU9MSHpoUkJFRGxjdVp3ektDV2FrNzJiTDkycWJFbHVPV25TNmFONTg9IiwiYW1yIjpbInJzYSIsIm1mYSJdLCJhcHBpZCI6IjE5NTBhMjU4LTIyN2ItNGUzMS1hOWNmLTcxNzQ5NTk0NWZjMiIsImFwcGlkYWNyIjoiMCIsImRldmljZWlkIjoiMDE4MzBkZjEtZTczYy00ODllLTg0OWEtN2U5OWU3NGFmMjZjIiwiZmFtaWx5X25hbWUiOiJFcm5zdCIsImdpdmVuX25hbWUiOiJTdGV2ZSIsImlwYWRkciI6IjEzMS4xMDcuMTc0LjEyMCIsIm5hbWUiOiJTdGV2ZSBFcm5zdCIsIm9pZCI6ImIwY2Q2OTExLWRmNTAtNGQyZS05MGQ0LThiMzQ0ZjRmOGQyZCIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0yMTI3NTIxMTg0LTE2MDQwMTI5MjAtMTg4NzkyNzUyNy0xNjQ0NzgyMyIsInB1aWQiOiIxMDAzQkZGRDhFMTU5QTUxIiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic3ViIjoiWGpvU3c4N2Fqa01TdjBseE8wUjBTTGtPYXNGaU8zUEN5VGptQl9rOWpGZyIsInRpZCI6IjcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0NyIsInVuaXF1ZV9uYW1lIjoic3Rlcm5zQG1pY3Jvc29mdC5jb20iLCJ1cG4iOiJzdGVybnNAbWljcm9zb2Z0LmNvbSIsInV0aSI6Im9mSnNFXzBsbTBlVEN0aWZRMEtOQUEiLCJ2ZXIiOiIxLjAifQ.VNlFQA57nNbQHaMnf6e2jhogU0TS-C-WdKHRlcTgCkLAxQFRTtssO4BBU11hi7lwTUwYSJLjI4NkyuHsMuj8GomlPpbCv71r7FcEUB2cIKIGT43G0O1jBF9mhwJyabNn_EqBgHzlWTM4eADjeEMbWXrA9D_hY3rCOnTiUonriVME3P475jlVwRJdx_iUKGFZcedhKvJnFyOMgy2Gy6kmPaGIaNnJogsdRr72CKOJ3dtXTfomfnizsCooCTHNwPaQUNCJ2sYqUBexZ9D7AmsLnsUI8br5EdtWilw8QledK0VNJEOlsd-fGcSgUR-yCbxdSN3vvRRaUAmRjPceDFHJHA',
        subscriptions: null,
        resourceId: '/subscriptions/b27cf603-5c35-4451-a33a-abba1a08c9c2/resourceGroups/akphplinux/providers/Microsoft.Web/sites/akphplinux',
        workflowId: '',
        supportTopicId: '',
        additionalParameters: {
            featurePath: '/detectors/LinuxContainerRecycle'
        }
    }

    public get hasLocalStartupInfo() {
        return this.localStartUpInfo && this.localStartUpInfo.token && this.localStartUpInfo.resourceId;
    }

    constructor(private _http: Http, private _portalService: PortalService) {
        this.inIFrame = window.parent !== window;
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
            startupInfo = of<StartupInfo>(this.localStartUpInfo)
        }

        return startupInfo.pipe(
            map((info: StartupInfo) => {
                if (info && info.resourceId) {
                    info.resourceId = info.resourceId.toLowerCase();

                    this.currentToken = info.token;

                    if (!this.resourceType) {
                        this.resourceType = info.resourceId.toLowerCase().indexOf('hostingenvironments') > 0 ? ResourceType.HostingEnvironment : ResourceType.Site;
                    }

                    info.resourceType = this.resourceType;
                    return info;
                }
            }));
    }
}