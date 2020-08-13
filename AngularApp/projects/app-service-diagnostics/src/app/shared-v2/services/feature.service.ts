import { Injectable } from '@angular/core';
import { DiagnosticService, DetectorMetaData, DetectorType, TelemetryService } from 'diagnostic-data';
import { Category } from '../models/category';
import { Feature, FeatureType, FeatureTypes, FeatureAction } from '../models/features';
import { ContentService } from './content.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../startup/services/auth.service';
import { LoggingV2Service } from './logging-v2.service';
import { SiteService } from '../../shared/services/site.service';
import { CategoryService } from '../../shared-v2/services/category.service';
import { PortalActionService } from '../../shared/services/portal-action.service';
import { StartupInfo } from '../../shared/models/portal';
import { VersionTestService } from '../../fabric-ui/version-test.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs-compat/operator/filter';
import { map } from 'rxjs/operators';

@Injectable()
export class FeatureService {

  private _detectors: DetectorMetaData[];
  protected _features: Feature[] = [];
  protected _featureDisplayOrder = [];
  private categories: Category[] = [];
  private _featureSub: BehaviorSubject<Feature[]> = new BehaviorSubject<Feature[]>([]);
  protected isLegacy: boolean;
  constructor(protected _diagnosticApiService: DiagnosticService, protected _contentService: ContentService, protected _router: Router, protected _authService: AuthService,
    protected _logger: TelemetryService, protected _siteService: SiteService, protected _categoryService: CategoryService, protected _activatedRoute: ActivatedRoute, protected _portalActionService: PortalActionService, protected versionTestService: VersionTestService) {
    this.versionTestService.isLegacySub.subscribe(isLegacy => this.isLegacy = isLegacy);
    this._categoryService.categories.subscribe(categories => this.categories = categories);
    this._authService.getStartupInfo().subscribe(startupInfo => {
      this._diagnosticApiService.getDetectors().subscribe(detectors => {
        this._detectors = detectors;
        detectors.forEach(detector => {
          if ((detector.category && detector.category.length > 0) ||
            (detector.description && detector.description.length > 0)) {
            if (detector.type === DetectorType.Detector) {
              this._features.push(<Feature>{
                id: detector.id,
                description: detector.description,
                category: detector.category,
                featureType: FeatureTypes.Detector,
                name: detector.name,
                clickAction: this._createFeatureAction(detector.name, detector.category, () => {
                  //Remove after A/B test
                  if (this.isLegacy) {
                    if (detector.id === 'appchanges') {
                      this._portalActionService.openChangeAnalysisBlade();
                    } else {
                      this._router.navigateByUrl(`resource${startupInfo.resourceId}/detectors/${detector.id}`);
                    }
                  } else {
                    const categoryId = this.getCategoryIdByCategoryName(detector.category);
                    this.navigatTo(startupInfo, categoryId, detector.id, DetectorType.Detector);
                  }
                })
              });
            } else {
              this._features.push(<Feature>{
                id: detector.id,
                description: detector.description,
                category: detector.category,
                featureType: FeatureTypes.Detector,
                name: detector.name,
                clickAction: this._createFeatureAction(detector.name, detector.category, () => {
                  if (this.isLegacy) {
                    this._router.navigateByUrl(`resource${startupInfo.resourceId}/analysis/${detector.id}`);
                  } else {
                    const categoryId = this.getCategoryIdByCategoryName(detector.category);
                    this.navigatTo(startupInfo, categoryId, detector.id, DetectorType.Analysis);
                  }
                })
              });
            }
          }
        });
        this.sortFeatures();
        this._featureSub.next(this._features);
      });

      this._contentService.getContent().subscribe(articles => {
        articles.forEach(article => {
          this._features.push(<Feature>{
            id: article.title,
            name: article.title,
            description: article.description,
            category: '',
            featureType: FeatureTypes.Documentation,
            clickAction: this._createFeatureAction(article.title, 'Content', () => {
              window.open(article.link, '_blank');
            })
          });
        });
      });
    });
  }

  sortFeatures() {
  }

  protected _createFeatureAction(name: string, category: string, func: Function): FeatureAction {
    return () => {
      const eventProperties = {
        'Name': name,
        'Category': category
      }
      this._logger.logEvent('FeatureClicked', eventProperties);
      func();
    };
  }

  getFeaturesForCategory(category: Category) {
    return this._features.filter(feature => feature.category === category.name);
  }

  getFeaturesForCategorySub(category: Category): Observable<Feature[]> {
    return this._featureSub.pipe(
      map(features => this.getFeaturesForCategory(category)
      ));
  }

  getFeatures(searchValue?: string) {
    const featureUnique = this._features.filter((feature, index, array) => {
      return array.findIndex(fea => feature.name === fea.name) === index;
    })

    if (!searchValue || searchValue === '') {
      // return this._features;
      return featureUnique;
    }

    searchValue = searchValue.toLowerCase();
    return featureUnique.filter(feature => {
      //Remove after A/B Test
      if (this.isLegacy) {
        return feature.name.toLowerCase().indexOf(searchValue) != -1
          || (feature.category && feature.category.toLowerCase().indexOf(searchValue) != -1)
          || (feature.description && feature.description.toLowerCase().indexOf(searchValue) != -1);
      } else {
        return feature.name.toLowerCase().indexOf(searchValue) != -1
          || (feature.category && feature.category.toLowerCase().indexOf(searchValue) != -1);
      }
    });
  }
  getCategoryIdByhDetectorId(detectorId: string): string {
    const detector = this._detectors.find(detector => detector.id === detectorId);
    return this.getCategoryIdByCategoryName(detector.category);
  }

  private getCategoryIdByCategoryName(name: string): string {
    //Default set to first category id, to make sure routing is working
    let categoryId: string = this.categories.length > 0 ? this.categories[0].id : "";
    const currentCategoryId = this._activatedRoute.root.firstChild.firstChild.firstChild.firstChild.snapshot.params["category"];
    //If category name is "XXX Tools" then should belong to Diagnostic Tool Category
    if (name && name.includes('Tools') && this.categories.find(category => category.name === "Diagnostic Tools")) {
      const category = this.categories.find(category => category.name === "Diagnostic Tools");
      categoryId = category.id;
    }
    else if (name && this.categories.find(category => category.name === name)) {
      const category = this.categories.find(category => category.name === name);
      categoryId = category.id;
    }
    //In category-overview page and uncategoried detector,return current categoryId
    else if (currentCategoryId) {
      categoryId = currentCategoryId;
    }
    //In home page,no categoryId in router,return category as availability&perf
    else if (this.categories.find(category => category.name === "Availability and Performance")) {
      const category = this.categories.find(category => category.name === "Availability and Performance");
      categoryId = category.id;
    }
    return categoryId;

  }

  private navigatTo(startupInfo: StartupInfo, category: string, detector: string, type: DetectorType) {
    if (detector === 'appchanges') {
      this._portalActionService.openChangeAnalysisBlade();
      return;
    }
    const isHomepage = !this._activatedRoute.root.firstChild.firstChild.firstChild.firstChild.snapshot.params["category"];
    //If it's in category overview page
    if (!isHomepage) {
      if (type === DetectorType.Detector) {
        this._router.navigateByUrl(`resource${startupInfo.resourceId}/categories/${category}/detectors/${detector}`);
      } else if (type === DetectorType.Analysis) {
        this._router.navigateByUrl(`resource${startupInfo.resourceId}/categories/${category}/analysis/${detector}`);
      }

    }
    //If it's in Home page,open new category page
    else {
      this._portalActionService.openBladeDiagnoseDetectorId(category, detector, type);
    }
  }
}
