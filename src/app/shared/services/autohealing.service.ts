import { Injectable } from "@angular/core";
import { ArmService } from "./arm.service";
import { AuthService } from "../../startup/services/auth.service";
import { Http } from "@angular/http";
import { UriElementsService } from "./urielements.service";
import { Observable } from "rxjs";
import { AutoHealSettings } from "../models/autohealing";
import { SiteInfoMetaData } from "../models/site";
import { ResponseMessageEnvelope } from "../models/responsemessageenvelope";

@Injectable()
export class AutohealingService {
    constructor(private _armService: ArmService, private _authService: AuthService, private _http: Http, private _uriElementsService: UriElementsService) {
    }

    getAutohealSettings(site: SiteInfoMetaData): Observable<AutoHealSettings> {
        let resourceUri: string = this._uriElementsService.getConfigWebUrl(site);
        return this._armService.getResource<ResponseMessageEnvelope<AutoHealSettings>>(resourceUri, null, true)
            .map((response: ResponseMessageEnvelope<AutoHealSettings>) => {
                let autohealSettings: AutoHealSettings = new AutoHealSettings();
                autohealSettings.autoHealEnabled = response.properties.autoHealEnabled;
                autohealSettings.autoHealRules = response.properties.autoHealRules;
                return autohealSettings;
            });

    }

    updateAutohealSettings(site: SiteInfoMetaData, autohealSettings: AutoHealSettings): Observable<AutoHealSettings> {
        let resourceUri: string = this._uriElementsService.getConfigWebUrl(site);
        let properties = { "properties": autohealSettings };
        return this._armService.putResource(resourceUri, properties, null, true).map((response: ResponseMessageEnvelope<AutoHealSettings>) => {
            let autohealSettings: AutoHealSettings = new AutoHealSettings();
            autohealSettings.autoHealEnabled = response.properties.autoHealEnabled;
            autohealSettings.autoHealRules = response.properties.autoHealRules;
            return autohealSettings;
        });
    }
}