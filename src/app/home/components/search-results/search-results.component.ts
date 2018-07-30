import { Component, OnChanges, Input, PipeTransform, Pipe, SimpleChanges } from '@angular/core';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { Feature } from '../../../shared-v2/models/features';
import { NavigationExtras, ActivatedRoute, Router } from '../../../../../node_modules/@angular/router';

@Component({
  selector: 'search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnChanges {

  @Input() searchValue: string;

  features: Feature[];

  constructor(public featureService: FeatureService, private _activatedRoute: ActivatedRoute, private _router: Router) { }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['searchValue']){
      this.features = this.featureService.getFeatures(this.searchValue);
    }
  }

  navigateToFeature(feature: Feature) {
    if (feature.path) {
      let navigationExtras: NavigationExtras = {
        queryParamsHandling: 'preserve',
        preserveFragment: true,
        relativeTo: this._activatedRoute
      };
  
      this._router.navigate(feature.path.split('/'), navigationExtras);
    }
    else if (feature.href) {
      window.open(feature.href, '_blank');
    }
  }
}
