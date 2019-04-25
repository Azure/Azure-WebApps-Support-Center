import { DetectorMetaData, DetectorTag, DiagnosticService } from 'diagnostic-data';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../startup/services/auth.service';
import { Category } from '../models/category';
import { Feature, FeatureAction, FeatureTypes } from '../models/features';
import { ContentService } from './content.service';
import { LoggingV2Service } from './logging-v2.service';

@Injectable()
export class FeatureService {

  public detectors: DetectorMetaData[];

  protected _features: Feature[] = [];

  constructor(protected _diagnosticApiService: DiagnosticService, protected _contentService: ContentService, protected _router: Router, protected _authService: AuthService,
    protected _logger: LoggingV2Service) {
    this._authService.getStartupInfo().subscribe(startupInfo => {

      this._diagnosticApiService.getDetectors().subscribe(detectors => {
        detectors.forEach(detector => {
          if (!detector.tags.includes(DetectorTag.WaitingForValidation)) {
            this._features.push(<Feature>{
                id: detector.id,
                description: detector.description,
                category: detector.category,
                featureType: FeatureTypes.Detector,
                name: detector.name,
                tags: detector.tags,
                clickAction: this._createFeatureAction(detector.name, detector.category, () => {
                this._router.navigateByUrl(`resource${startupInfo.resourceId}/detectors/${detector.id}`);
                })
            });
          }
        });
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
