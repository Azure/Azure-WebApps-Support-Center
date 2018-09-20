import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { Feature, FeatureTypes } from '../../../shared-v2/models/features';
import { NavigationExtras, ActivatedRoute, Router } from '@angular/router';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';

@Component({
  selector: 'search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnChanges {

  @Input() searchValue: string;

  features: Feature[];

  constructor(public featureService: FeatureService, private _activatedRoute: ActivatedRoute, private _router: Router, private _logger: LoggingV2Service) { }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['searchValue']){
      this.features = this.featureService.getFeatures(this.searchValue);
    }
  }

  navigateToFeature(feature: Feature) {
    this._logSearchSelection(feature);
    feature.clickAction();    
  }

  private _logSearch() {
    this._logger.LogSearch(this.searchValue)
  }

  private _logSearchSelection(feature: Feature) {
    this._logSearch();
    this._logger.LogSearchSelection(this.searchValue, feature.id, feature.name, feature.featureType.name)
  }
}
