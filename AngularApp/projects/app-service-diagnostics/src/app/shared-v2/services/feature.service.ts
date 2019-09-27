import { Injectable } from '@angular/core';
import { DiagnosticService, DetectorMetaData, DetectorType } from 'diagnostic-data';
import { Category } from '../models/category';
import { Feature, FeatureType, FeatureTypes, FeatureAction } from '../models/features';
import { ContentService } from './content.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../startup/services/auth.service';
import { LoggingV2Service } from './logging-v2.service';
import { OperatingSystem } from '../../shared/models/site';
import { AppType } from '../../shared/models/portal';

@Injectable()
export class FeatureService {

  public detectors: DetectorMetaData[];

  protected _features: Feature[] = [];
  protected _featureDisplayOrder = [];

  constructor(protected _diagnosticApiService: DiagnosticService, protected _contentService: ContentService, protected _router: Router, protected _authService: AuthService,
    protected _logger: LoggingV2Service) {


    this._authService.getStartupInfo().subscribe(startupInfo => {
      this._diagnosticApiService.getDetectors().subscribe(detectors => {
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
                  this._router.navigateByUrl(`resource${startupInfo.resourceId}/detectors/${detector.id}`);
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
                  this._router.navigateByUrl(`resource${startupInfo.resourceId}/analysis/${detector.id}`);
                })
              });
            }
          }
        });

        this.sortFeatures();
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
      this._logger.LogClickEvent(name, 'feature', category);
      func();
    };
  }

  getFeaturesForCategory(category: Category) {
    return this._features.filter(feature => feature.category === category.name);
  }

  getFeatures(searchValue?: string) {
    if (!searchValue || searchValue === '') {
      return this._features;
    }

    searchValue = searchValue.toLowerCase();
    return this._features.filter(feature => {
      return feature.name.toLowerCase().indexOf(searchValue) != -1
        || (feature.category && feature.category.toLowerCase().indexOf(searchValue) != -1)
        || (feature.description && feature.description.toLowerCase().indexOf(searchValue) != -1);
    });
  }
}
