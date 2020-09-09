import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FetchDocumentsService } from 'projects/app-service-diagnostics/src/app/shared-v2/services/documents.service';
import { SearchResults } from 'projects/app-service-diagnostics/src/app/shared-v2/models/search-results';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { ISubscription } from "rxjs/Subscription";
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { map, catchError, delay, retryWhen, take } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { Query } from 'projects/app-service-diagnostics/src/app/shared-v2/models/query';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'documents-search',
  templateUrl: './documents-search.component.html',
  styleUrls: ['./documents-search.component.scss']
})
export class DocumentsSearchComponent extends DataRenderBaseComponent  implements OnInit {

  searchTermDisplay = ""
  showSearchTermPractices: boolean = false;
  showPreLoader: boolean = false;
  showPreLoadingError: boolean = false;
  preLoadingErrorMessage: string = "Some error occurred while fetching web results."
  subscription: ISubscription;
  viewResultsFromCSSWikionly : boolean = true

  @Input() searchTerm : string = ""; 
  @Input() isChildComponent: boolean = true;

  @Output() searchResults : SearchResults;
  @Output() searchResultsChange: EventEmitter<SearchResults> = new EventEmitter<SearchResults>();
    

  constructor(private _fetchDocumentsService : FetchDocumentsService,
              public telemetryService: TelemetryService,
              private _activatedRoute: ActivatedRoute ,
              private _router: Router   ) {
    super(telemetryService);
    console.log("Constructor initialized");
    const subscription = this._activatedRoute.queryParamMap.subscribe(qParams => {
      this.searchTerm = qParams.get('searchTerm') === null ? "" || this.searchTerm : qParams.get('searchTerm');
      this.refresh();
  });
  this.subscription = subscription;
   }

  
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  getLinkText(link: string) {
    return !link || link.length < 30 ? link : link.substr(0, 40) + '...';
    //console.log(link);
    
  }

  toggleCSSWikiResults()
  {
    this.viewResultsFromCSSWikionly = !this.viewResultsFromCSSWikionly;
    this.refresh();
  }

  triggerSearch(){
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
    } // End of if

    this.resetGlobals();
    let query: Query = {
      "searchID" : uuid(),
      "searchTerm" : this.searchTerm,
      "productName" : "App Services" ,
      "documentType" : "Internal" ,
      "documentSource" : [],
      "numberOfDocuments" : 5  

    };
    if(this.viewResultsFromCSSWikionly){
      query.documentSource.push("supportability.visualstudio.com")
    }
    let searchTask = this._fetchDocumentsService
                         .Search(query)
                         .pipe(map((res) => res), retryWhen(errors => {
              let numRetries = 0;
              return errors.pipe(delay(1000), map(err => {
                  if(numRetries++ === 3){
                      throw err;
                  }
                  return err;
              }));
          }), catchError(e => {
              this.handleRequestFailure();
              return Observable.throw(e);
          }));
    
    this.showPreLoader = true;
    searchTask.subscribe(results => {
      console.debug(results)
      this.showPreLoader = false;
      if (results && results.documents && results.documents.length > 0) {
          this.searchResults = results
          this.searchResultsChange.emit(this.searchResults);
      }
      else {
          this.searchTermDisplay = this.searchTerm.valueOf();
          this.showSearchTermPractices = true;
      }
      /* this.logEvent(TelemetryEventNames.WebQueryResults, { searchId: this.searchId, query: this.searchTerm, results: JSON.stringify(this.searchResults.map(result => {
          return {
              title: result.title.replace(";"," "),
              description: result.description.replace(";", " "),
              link: result.link
          };
      })), ts: Math.floor((new Date()).getTime() / 1000).toString() });*/
  },
  (err) => {
      this.handleRequestFailure();
  });
  }

  selectResult(document: any) {
    window.open(document.url , '_blank');
    this.logEvent(TelemetryEventNames.WebQueryResultClicked, { searchId: this.searchResults.searchID, article: JSON.stringify(document), ts: Math.floor((new Date()).getTime() / 1000).toString() });
  }
  refresh(){
    if (this.searchTerm && this.searchTerm.length > 1) {
      setTimeout(()=> {
          this.triggerSearch();
      }, 500);
    }
  }

  handleRequestFailure() {
    this.showPreLoadingError = true;
    this.showPreLoader = false;
    this.showSearchTermPractices = false;
  }
  clearSearchTerm() {
    this.searchTerm = "";
  }
  resetGlobals() {
    this.searchResults = null;
    this.showPreLoader = false;
    this.showPreLoadingError = false;
    this.showSearchTermPractices = false;
    this.searchTermDisplay = "";
  }
  ngOnInit(){
    if(!this.isChildComponent)
        {
          this.refresh();
        }
    
    /*.subscribe({
      next(result) {
        console.log("Result is here ",result);
        this.searchResults = result;
        return this.searchResults;
      },
      error(err) {console.log(err)}
    });;*/
                              
  }

}
