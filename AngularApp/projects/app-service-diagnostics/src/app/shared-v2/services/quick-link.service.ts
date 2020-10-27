import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ArmResourceConfig } from "../../shared/models/arm/armResourceConfig";
import { GenericArmConfigService } from "../../shared/services/generic-arm-config.service";


@Injectable()

export class QuickLinkService {
    public quickLinks: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
    private _quickLinks: string[] = [];
    constructor(private _genericArmConfigService?: GenericArmConfigService) { }
    public initQuickLinksForArmResource(resourceUri: string) {
        if (this._genericArmConfigService) {
            let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(resourceUri);
            if (currConfig.quickLinks && currConfig.quickLinks.length > 0) {
                this._addQuickLinks(currConfig.quickLinks);
            }
        }
    }
    protected _addQuickLinks(quickLinks:string[]) {
        //Filter out duplicate links
        const linkSet = new Set<string>([...this._quickLinks]);
        for(let link of quickLinks){
            linkSet.add(link);
        }
        const newLinkArray = Array.from(linkSet);
        this.quickLinks.next(newLinkArray);
    }
}