import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { AppInsightsService, CacheService } from '../../../shared/services';

@Injectable()
export class AppInsightsQueryService {

    constructor(private appinsightsService: AppInsightsService, private cache: CacheService) {
    }

    GetTopExceptions(startTimeUTC: string, endTimeUTC: string, recordsLimit: number = 5, invalidateCache: boolean = false) {

        let query: string = `
        exceptions
        | where timestamp >= datetime(${startTimeUTC}) and timestamp <= datetime(${endTimeUTC})  
        | where client_Type == "PC" 
        | summarize count() by outerMessage, problemId
        | top ${recordsLimit} by count_ desc`;

        let requests = this.appinsightsService.ExecuteQuery(query);

        return this.cache.get(`${startTimeUTC}--${endTimeUTC}`, requests, invalidateCache)
    }

    GetTopSlowestDependencies(startTimeUTC: Date, endTimeUTC: Date, dependencyCallCountLowerBound?: number) {

        let query: string = `
        dependencies
        | where type != "Ajax"
        | summarize percentiles(duration, 50), count()  by name 
        | where count_ > 10
        | top 5 by percentile_duration_50  desc`;

        return this.appinsightsService.ExecuteQuery(query);
    }

    private isNotNullOrEmpty(item: any): boolean {
        return (item && item != '');
    }
}