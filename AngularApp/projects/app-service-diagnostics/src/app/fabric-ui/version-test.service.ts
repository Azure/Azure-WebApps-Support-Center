import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DemoSubscriptions } from '../betaSubscriptions';
import { AuthService } from '../startup/services/auth.service';
import { ResourceType, AppType } from '../shared/models/portal';
import { SiteService } from '../shared/services/site.service';
import { BehaviorSubject } from 'rxjs';
import { Site } from '../shared/models/site';

@Injectable({
    providedIn:'root'
})
export class VersionTestService {
    public isLegacySub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true); 
    public isVnextSub: boolean = false; 
    public isWindowsWebApp: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true); 
    public initializedPortalVersion: BehaviorSubject<string> = new BehaviorSubject<string>("v2");

    // If overrideUseLegacy is not set, we still use the logic to return true for windows web app, return false for other resource types
    // If overrideUseLegacy is set, this will take precedence of our existing logic:
    // overrideUseLegacy = 1, we switch to the old experience. 
    // overrideUseLegacy = 2, we switch to the new experience. 
    public overrideUseLegacy: BehaviorSubject<number> = new BehaviorSubject(0); 
    constructor(private _authService: AuthService, private _siteService: SiteService) {
        this._authService.getStartupInfo().subscribe(startupInfo => {
            const resourceType = this._authService.resourceType;
            const resourceId = startupInfo.resourceId;
            const subId = resourceId.split('/')[2];
            // Change the percentageToRelease accordingly for more customers, for now it's around 10%
            this.isVnextSub = this.isVnextSubscription(subId, 0.75);
            this._siteService.currentSite.subscribe(site => {
                this.overrideUseLegacy.subscribe(overrideValue => {
                    const isWebAppResource = this.isWindowsWebAppResource(site, resourceType);
                    // Initialize with the new version if the subscription falls in vnext sub groups and the resource is web app
                    this.initializedPortalVersion.next(this.isVnextSub && isWebAppResource ? "v3" : "v2");
                    // The current expericence can still be override if customer click on the link to switch to a different version
                    const shouldUseLegacy = overrideValue !== 0 ? overrideValue === 1 : (!this.isVnextSub||!isWebAppResource);
                    this.isLegacySub.next(shouldUseLegacy);
                    this.isWindowsWebApp.next(isWebAppResource);
                });
            });
        });
    }

    // If overrideUseLegacy is set, this will take precedence of our existing logic to determine if we will use new experience.
    public setLegacyFlag(useLegacy) {
        this.overrideUseLegacy.next(useLegacy);
    }

    private isWindowsWebAppResource(site: Site, resourceType: ResourceType): boolean {
        let isLinuxPlatform = site && site.kind && site.kind.toLowerCase().indexOf('linux') >= 0;
        return resourceType === ResourceType.Site && site && site.appType === AppType.WebApp && !isLinuxPlatform;
    }

    private isVnextSubscription(subscriptionId: string, percentageToRelease: number = 0.1): boolean {
        percentageToRelease = percentageToRelease < 0 || percentageToRelease > 1 ? 0.1 : percentageToRelease;
        let isBetaSubscription = DemoSubscriptions.betaSubscriptions.findIndex(item => subscriptionId.toLowerCase() === item.toLowerCase()) > -1;
        if (isBetaSubscription) {
            return true;
        }

        // roughly split of percentageToRelease of subscriptions to use new feature.
        let firstDigit = "0x" + subscriptionId.substr(0, 1);
        return (16 -parseInt(firstDigit, 16))/16 <= percentageToRelease;
    }
}
