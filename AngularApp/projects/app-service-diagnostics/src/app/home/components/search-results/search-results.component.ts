import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { Feature } from '../../../shared-v2/models/features';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { NotificationService } from '../../../shared-v2/services/notification.service';

@Component({
  selector: 'search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnChanges {

  @Input() searchValue: string;

  features: Feature[];

  constructor(public featureService: FeatureService, private _activatedRoute: ActivatedRoute, private _router: Router, private _logger: LoggingV2Service, private _notificationService: NotificationService) { }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['searchValue']){
      this.features = this.featureService.getFeatures(this.searchValue);
    }
  }

  navigateToFeature(feature: Feature) {
    this._notificationService.dismiss();
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
