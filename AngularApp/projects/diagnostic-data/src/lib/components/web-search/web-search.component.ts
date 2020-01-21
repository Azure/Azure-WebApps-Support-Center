import { Component, Inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { map, catchError, delay, retryWhen, take } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { GenericContentService } from '../../services/generic-content.service';
@Component({
    selector: 'web-search',
    templateUrl: './web-search.component.html',
    styleUrls: ['./web-search.component.scss']
})
export class WebSearchComponent extends DataRenderBaseComponent implements OnInit {
    isPublic: boolean = false;
    @Input() searchTerm: string = '';
    @Input() searchId: string = '';
    @Input() isChildComponent: boolean = true;
    @Input() searchResults: any[] = [];
    @Output() searchResultsChange: EventEmitter<any[]> = new EventEmitter<any[]>();
    searchTermDisplay: string = '';
    showSearchTermPractices: boolean = false;
    showPreLoader: boolean = false;
    showPreLoadingError: boolean = false;
    preLoadingErrorMessage: string = "Some error occurred while fetching web results."
    timeout: any = null;

    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, public telemetryService: TelemetryService,
        private _activatedRoute: ActivatedRoute, private _router: Router, private _contentService: GenericContentService) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;
        this._activatedRoute.queryParamMap.subscribe(qParams => {
            this.searchTerm = qParams.get('searchTerm') === null ? "" || this.searchTerm : qParams.get('searchTerm');
            if (this.timeout){
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(() =>{
                this.refresh();
            }, 200);
        });
    }
    
    ngOnInit() {
        this.refresh();
    }

    refresh() {
        if (this.searchTerm && this.searchTerm.length > 1) {
            this.triggerSearch();
        }
    }

    handleRequestFailure() {
        this.showPreLoadingError = true;
        this.showPreLoader = false;
        this.showSearchTermPractices = false;
    }

    triggerSearch() {
        if (!this.isChildComponent){
            const queryParams: Params = { searchTerm: this.searchTerm };
            this._router.navigate(
                [],
                {
                    relativeTo: this._activatedRoute,
                    queryParams: queryParams,
                    queryParamsHandling: 'merge'
                }
            );
        }
        this.resetGlobals();
        if (!this.searchId || this.searchId.length===0) this.searchId = uuid();
        let searchTask = this._contentService.searchWeb(this.searchTerm).pipe(map((res) => res), retryWhen(errors => errors.pipe(delay(2000), take(3))), catchError(e => {
            this.handleRequestFailure();
            return null;
        }));
        this.showPreLoader = true;
        searchTask.subscribe(results => {
            this.showPreLoader = false;
            if (results && results.webPages && results.webPages.value && results.webPages.value.length > 0) {
                this.searchResults = results.webPages.value.map(result => {
                    return {
                        title: result.name,
                        description: result.snippet,
                        link: result.url
                    };
                });
                this.searchResultsChange.emit(this.searchResults);
            }
            else {
                this.showSearchTermPractices = true;
            }
            this.logEvent(TelemetryEventNames.WebQueryResults, { searchId: this.searchId, query: this.searchTerm, results: JSON.stringify(this.searchResults), ts: Math.floor((new Date()).getTime() / 1000).toString() });
        },
        (err) => {
            this.showPreLoader = false;
            this.handleRequestFailure();
        });
    }

    selectResult(article: any) {
      window.open(article.link, '_blank');
      this.logEvent(TelemetryEventNames.WebQueryResultClicked, { searchId: this.searchId, article: JSON.stringify(article), ts: Math.floor((new Date()).getTime() / 1000).toString() });
    }
  
    getLinkText(link: string) {
      return !link || link.length < 20 ? link : link.substr(0, 25) + '...';
    }

    resetGlobals() {
        this.searchResults = [];
        this.showPreLoader = false;
        this.showPreLoadingError = false;
        this.showSearchTermPractices = false;
    }
}
