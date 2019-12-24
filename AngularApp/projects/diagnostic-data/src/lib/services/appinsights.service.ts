import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable ,  BehaviorSubject, of, ReplaySubject } from 'rxjs';

@Injectable()
  
export class AppInsightsQueryService {

    public loadAppInsightsResourceObservable: BehaviorSubject<boolean>;

    public appInsightsSettings: any = {
        validForStack: undefined,
        enabledForWebApp: undefined,
        connectedWithSupportCenter: undefined,
        resourceUri: undefined,
        name: undefined,
        appId: undefined
      };

    CheckIfAppInsightsEnabled(): Observable<boolean>
    {
        return null;
    }

    ExecuteQuerywithPostMethod(query: string): Observable<any>
    {
        return null;
    }

    openAppInsightsFailuresBlade()
    {
    }

    openAppInsightsBlade() {
    }

    openAppInsightsPerformanceBlade() {
    }

    openAppInsightsExtensionBlade(detailBlade?: string)
    {

    }
}

