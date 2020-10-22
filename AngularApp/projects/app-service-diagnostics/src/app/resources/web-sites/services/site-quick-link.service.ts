import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AppType } from "../../../shared/models/portal";
import { Sku } from "../../../shared/models/server-farm";
import { HostingEnvironmentKind, OperatingSystem } from "../../../shared/models/site";
import { SiteFilteredItem } from "../models/site-filter";
import { WebSiteFilter } from "../pipes/site-filter.pipe";


@Injectable({providedIn:"root"})

export class SiteQuickLinkService {
    // public quickLinks:BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
    public quickLinks: string[] = [];
    private _siteQuickLinks: SiteFilteredItem<QuickLink>[] = [
        {
            appType:AppType.WebApp,
            platform: OperatingSystem.windows,
            stack: '',
            sku: Sku.All,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            item:{
                detectorIds:[
                    'appDownAnalysis',
                    'perfAnalysis',
                    'webappcpu',
                ],
            }
        }
    ];

    constructor(private _websiteFilter: WebSiteFilter){
      const quickLinks = this._websiteFilter.transform(this._siteQuickLinks);
      let detectorIds:string[] = [];
      for(const quickLink of quickLinks){
          detectorIds = detectorIds.concat(quickLink.detectorIds);
      }
    this.quickLinks = detectorIds;
    }


}


interface QuickLink{
    detectorIds:string[];
}