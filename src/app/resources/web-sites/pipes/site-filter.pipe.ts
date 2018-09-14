import { Pipe, PipeTransform } from "@angular/core";
import { SiteFilteredItem } from "../models/site-filter";
import { WebSitesService } from "../../../shared-v2/services/web-sites.service";
import { filter } from "../../../../../node_modules/rxjs/operators";

@Pipe({ name: 'website' })
export class WebSiteFilter implements PipeTransform {

    constructor(private _webSiteService: WebSitesService) {}

    transform<T>(siteFilteredItems: SiteFilteredItem<T>[], overrideStack?:string): T[] {
        return siteFilteredItems
            .filter(item => 
                    (item.appType & this._webSiteService.appType) > 0 &&
                    (item.platform & this._webSiteService.platform) > 0 &&
                    (item.sku & this._webSiteService.sku) > 0 &&
                    (item.stack === '' || item.stack.toLowerCase().indexOf(overrideStack ? overrideStack.toLowerCase() : this._webSiteService.appStack.toLowerCase()) >= 0)
            )
            .map(item => item.item);
    }
}