import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticSiteService {

    parseResourceUri(resourceUri: string): any {
        return null;
    }

    restartSite(subscriptionId: string, resourceGroup: string, siteName: string): Observable<boolean> {
        return null;
    }

    restartSiteFromUri(resourceUri: string): Observable<HttpResponse<any>> {
        return null;
    }

    killW3wpOnInstance(subscriptionId: string, resourceGroup: string, siteName: string, scmHostName: string,
            instanceId: string): Observable<boolean> {
        return null;
    }

    getSiteAppSettings(subscriptionId: string, resourceGroup: string, siteName: string,
            slot: string = ''): Observable<any> {
        return null;
    }

    getVirtualNetworkConnectionsInformation(subscriptionId: string, resourceGroup: string, siteName: string,
            slot: string = ''): Observable<any> {
        return null;
    }

    updateSiteAppSettings(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '',
            body: any): Observable<any> {
        return null;
    }

    updateSettingsFromUri(resourceUri: string, body: any): Observable<any> {
        return null;
    }

    azureApiRequest(method: string, resourceUri: string, body: any = null): Observable<HttpResponse<any>> {
        return null;
    }

}
