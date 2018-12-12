
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ObserverSiteResponse, ObserverSiteInfo, ObserverAseResponse } from '../models/observer';
import { DiagnosticApiService } from './diagnostic-api.service';
import { isArray } from 'util';

@Injectable()
export class ObserverService {

  constructor(private _diagnosticApiService: DiagnosticApiService) { }

  // WARNING: This is broken logic because of bug in sites API
  //          Hostnames will be incorrect if there is another
  //          app with the same name. Pending fix from Hawk
  public getSite(site: string): Observable<ObserverSiteResponse> {
    return this._diagnosticApiService.get<ObserverSiteResponse>(`api/sites/${site}`).pipe(
      map((site : ObserverSiteResponse) => {
        if (site && site.details && isArray(site.details)) {
          site.details.map(info => this.getSiteInfoWithSlotAndHostnames(info, site.hostNames))
        }
       
        return site;
      }));
  }

  public getAse(ase: string): Observable<ObserverAseResponse> {
    return this._diagnosticApiService.get<ObserverAseResponse>(`api/hostingEnvironments/${ase}`);
  }

  public getSiteRequestBody(site: string, stamp: string) {
    return this._diagnosticApiService.get<ObserverSiteResponse>(`api/stamps/${stamp}/sites/${site}/postBody`);
  }

  public getAseRequestBody(name: string) {
    return this._diagnosticApiService.get<ObserverSiteResponse>(`api/hostingEnvironments/${name}/postBody`);
  }

  private getSiteInfoWithSlotAndHostnames(site: ObserverSiteInfo, hostnames: string[]): ObserverSiteInfo {
    let siteName = site.SiteName;
    let slot = '';

    if (siteName.indexOf('(') > 0) {
      let split = site.SiteName.split('(')
      slot = split[1].replace(')', '');
    }

    site.SlotName = slot;
    site.Hostnames = hostnames;

    return site;
  }

}

class ObserverCache {

}
