import { Injectable } from "@angular/core";
import { ArmService } from "./arm.service";
import { AuthService } from "./auth.service";
import { Http, RequestOptions, Headers } from "@angular/http";
import { UriElementsService } from "./urielements.service";
import { Observable } from "rxjs";
import { AutoHealSettings } from "../models/autohealing";
import { SiteInfoMetaData } from "../models/site";
import { ResponseMessageCollectionEnvelope, ResponseMessageEnvelope } from "../models/responsemessageenvelope";

@Injectable()
export class AutohealingService {
    constructor(private _armService: ArmService, private _authService: AuthService, private _http: Http, private _uriElementsService: UriElementsService) {
    }

    getAutohealSettings(site: SiteInfoMetaData): Observable<AutoHealSettings> {
        let resourceUri: string = this._uriElementsService.getConfigWebUrl(site);
        return this._armService.getResource<ResponseMessageEnvelope<AutoHealSettings>>(resourceUri).map((response: ResponseMessageEnvelope<AutoHealSettings>) => {
            let autohealSettings: AutoHealSettings = new AutoHealSettings();
            autohealSettings.autoHealEnabled = response.properties.autoHealEnabled;
            autohealSettings.autoHealRules = response.properties.autoHealRules;
            return autohealSettings;
        });

    }

    // updateAutohealSettings(site: SiteInfoMetaData, autohealSettings: AutoHealSettings): Observable<any> {
    //     let resourceUri: string = this._uriElementsService.getConfigWebUrl(site);
    //     return this._armService.getResource(resourceUri).map((response: ResponseMessageEnvelope<any>) => {
    //         let existingSettings = response;
    //         existingSettings.properties.autoHealEnabled = autohealSettings.autoHealEnabled;
    //         existingSettings.properties.autoHealRules = autohealSettings.autoHealRules;
    //         return this._armService.putResource(resourceUri, existingSettings, null, true).subscribe((resp) => {
    //             return resp;
    //         });
    //     });
    // }


    updateAutohealSettings(site: SiteInfoMetaData, autohealSettings: AutoHealSettings): Observable<any> {
        let resourceUri: string = this._uriElementsService.getConfigWebUrl(site);
        let properties = { "properties": autohealSettings};
        return this._armService.putResource(resourceUri, properties, null, true);
        
    }

    timespanToSeconds(timeInterval: string): number {
        if (timeInterval.indexOf(':') < 0) {
          return 0;
        }
        var a = timeInterval.split(':'); // split it at the colons
        // minutes are worth 60 seconds. Hours are worth 60 minutes.    
        var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
        return seconds;
      }
    
      secondsToTimespan(seconds: number): string {
        var date = new Date(null);
        date.setSeconds(seconds); // specify value for SECONDS here
        var timeString = date.toISOString().substr(11, 8);
        return timeString;
      }
}