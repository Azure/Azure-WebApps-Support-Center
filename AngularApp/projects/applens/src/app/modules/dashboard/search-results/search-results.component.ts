import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras} from '@angular/router';
import { DetectorMetaData } from 'diagnostic-data';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import {TelemetryEventNames} from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { v4 as uuid } from 'uuid';
import { SearchService } from '../services/search.service';

@Component({
  selector: 'search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
  filteredDetectors: DetectorMetaData[] = [];
  detectorsLoaded: boolean = false;
  
  searchResultsFetchError: string = "";
  searchResultsFetchErrorDisplay: boolean = false;

  searchTermErrorDisplay: boolean = false;

  searchTermDisplay: string = "";

  constructor(private _telemetryService: TelemetryService, private _route: Router, private _activatedRoute: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService, private _supportTopicService: ApplensSupportTopicService, private _location: Location, public _searchService: SearchService) {
  }

  navigateTo(path: string, queryParams?: any, queryParamsHandling?: any) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: queryParamsHandling || 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute,
      queryParams: queryParams
    };
    this._route.navigate([path], navigationExtras);
  }

  navigateBack(){
    this._location.back();
  }

  executeSearch(searchTerm){
    this.detectorsLoaded = false;
    if (!this._searchService.searchId || this._searchService.searchId.length==0){
      this._searchService.searchId = uuid();
      this._searchService.newSearch = true;
    }
    if (this._searchService.newSearch){
      this._diagnosticService.getDetectors(true, searchTerm).subscribe((detectors: DetectorMetaData[]) => {
        //Logging for new search only
        this._telemetryService.logEvent(TelemetryEventNames.SearchQueryResults, { searchId: this._searchService.searchId, query: searchTerm, results: JSON.stringify(detectors.map((det: DetectorMetaData) => new Object({ id: det.id, score: det.score}))), ts: Math.floor((new Date()).getTime() / 1000).toString() });
        this._searchService.newSearch = false;
        
        this.filteredDetectors = detectors;
        this._searchService.detectors = [];
        this.searchTermDisplay = this._searchService.currentSearchTerm.valueOf();
        setTimeout(() => {
          this.detectorsLoaded = true;
          setTimeout(() => {
            document.getElementById("search-result-0").focus();
            this._telemetryService.logEvent(TelemetryEventNames.SearchResultsLoaded, {"searchId": this._searchService.searchId, "ts": Math.floor((new Date()).getTime() / 1000).toString()});
          }, 100);
        }, 500);
        
        if (detectors !== null){
          this.filteredDetectors.forEach((detector) => {
              this._supportTopicService.getCategoryImage(detector.name).subscribe((iconString) => {
                let detectorItem = new DetectorItem(detector.id, detector.name, detector.description, iconString, [], detector.score);
                this._searchService.detectors.push(detectorItem);

              });
          });
          this._searchService.detectors;
        }
      },
      (err: HttpErrorResponse)=> {
        this.detectorsLoaded = true;
        this.searchResultsFetchError = "I am sorry, some error occurred while processing.";
        this.searchResultsFetchErrorDisplay = true;
      });
    }
    else{
      this.searchTermDisplay = this._searchService.currentSearchTerm.valueOf();
      setTimeout(() => {
        this.detectorsLoaded = true;
        setTimeout(() => {
          document.getElementById("search-result-0").focus();
          this._telemetryService.logEvent(TelemetryEventNames.SearchResultsLoaded, {"searchId": this._searchService.searchId, "ts": Math.floor((new Date()).getTime() / 1000).toString()});
        }, 100);
      }, 500);
    }
  }

  detectorClick(detector, index){
    // Log detector click and navigate the respective detector
    this._telemetryService.logEvent(TelemetryEventNames.SearchResultClicked, { searchId: this._searchService.searchId, detectorId: detector.id, rank: (index+1).toString(), ts: Math.floor((new Date()).getTime() / 1000).toString() });
    this.navigateTo(`../detectors/${detector.id}`);
  }

  ngOnInit() {
    this._activatedRoute.queryParams.subscribe(params => {
      var searchTerm: string = params['searchTerm'];
      // Trim search term (to handle cases when we deeplink applens search)
      if (searchTerm && searchTerm.length>0){
        searchTerm = searchTerm.trim();
      }
      if (searchTerm != this._searchService.currentSearchTerm){
        this._searchService.newSearch = true;
        this._searchService.currentSearchTerm = searchTerm;
        this._searchService.searchTerm = searchTerm;
      }
      if (this._searchService.currentSearchTerm && this._searchService.currentSearchTerm.length>3){
        this.searchTermErrorDisplay = false;
        this.searchResultsFetchErrorDisplay = false;
        this.executeSearch(this._searchService.currentSearchTerm);
      }
      else{
        this.detectorsLoaded = true;
        this.displaySearchTermError();
      }
    });
  }

  searchResultFeedback(detector, rating){
    if (rating != detector.feedbackState){
      detector.feedbackState = rating;
      this._telemetryService.logEvent(TelemetryEventNames.SearchResultFeedback, {"detectorId": detector.id, "searchId": this._searchService.searchId, "rating": rating});
    }
  }

  displaySearchTermError(){
    this.searchTermErrorDisplay = true;
  }

  navigateToUserPage(userId: string) {
    this.navigateTo(`../../users/${userId}`);
  }
}

export class DetectorItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  supportTopics: any[] = [];
  score: number;
  onClick: Function;
  feedbackState: number;

  constructor(id: string, name: string, description: string, icon: string, supportTopics: any[], score: number) {
      this.name = name;
      this.id = id;
      this.feedbackState = 0;

      if (description == undefined || description === "") {
          description = "This detector doesn't have any description."
      }
      this.description = description;
      this.icon = icon;
      this.supportTopics = supportTopics;
      this.score = score;
  }
}
