import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable ,  BehaviorSubject, of, ReplaySubject } from 'rxjs';

@Injectable()
  
export class AppInsightsQueryService {

    public loadAppInsightsResourceObservable: BehaviorSubject<boolean>;

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

