import { Injectable } from '@angular/core';
import { DiagnosticService } from 'applens-diagnostics';
import { DetectorMetaData } from '../../../../node_modules/applens-diagnostics/src/app/diagnostic-data/models/detector';
import { CategoryService } from './category.service';
import { Category } from '../models/category';
import { Feature, FeatureType, FeatureTypes } from '../models/features';
import { ContentService } from './content.service';

@Injectable()
export class FeatureService {

  public detectors: DetectorMetaData[];
  categories: Category[];

  private _features: Feature[] = [];

  constructor(private _diagnosticApiService: DiagnosticService, private _categoryService: CategoryService, private _contentService: ContentService) {
    this._categoryService.categories.flatMap(categories => this.categories = categories);

    this._diagnosticApiService.getDetectors().subscribe(detectors => {
      detectors.forEach(detector => {
        this._features.push(<Feature>{
          id: detector.id,
          description: detector.description,
          category: detector.category,
          featureType: FeatureTypes.Detector,
          name: detector.name,
          path: `detectors/${detector.id}`,
          href: null
        });
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
          path: null,
          href: article.link
        });
      })
    })
  }

  getFeatures(searchValue?: string) {
    if(!searchValue || searchValue === '') {
      return this._features;
    }

    searchValue = searchValue.toLowerCase();
    return this._features.filter(feature => {
      return feature.name.toLowerCase().indexOf(searchValue) != -1
        || (feature.category && feature.category.toLowerCase().indexOf(searchValue) != -1)
        || (feature.description && feature.description.toLowerCase().indexOf(searchValue) != -1)
    });
  }
}
