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
    public isExternalSub: boolean = true; 
    public isWindowsWebApp: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true); 
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
            this.isExternalSub = DemoSubscriptions.betaSubscriptions.findIndex(item => item.toLowerCase() === subId.toLowerCase()) === -1;
            this._siteService.currentSite.subscribe(site => {
                this.overrideUseLegacy.subscribe(overrideValue => {
                    const isWebAppResource = this.isWindowsWebAppResource(site, resourceType);
                    const shouldUseLegacy = overrideValue !== 0 ? overrideValue === 1 : (this.isExternalSub||!isWebAppResource);
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
}
