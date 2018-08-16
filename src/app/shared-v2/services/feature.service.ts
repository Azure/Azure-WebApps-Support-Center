import { Injectable } from '@angular/core';
import { DiagnosticService, DetectorMetaData } from 'applens-diagnostics';
import { CategoryService } from './category.service';
import { Category } from '../models/category';
import { Feature, FeatureType, FeatureTypes } from '../models/features';
import { ContentService } from './content.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from './resource.service';
import { AuthService } from '../../startup/services/auth.service';

@Injectable()
export class FeatureService {

  public detectors: DetectorMetaData[];
  categories: Category[];

  private _features: Feature[] = [];

  constructor(private _diagnosticApiService: DiagnosticService, private _categoryService: CategoryService, private _contentService: ContentService, private _router: Router, private _authService: AuthService) {
    this._authService.getStartupInfo().subscribe(startupInfo => {
      this._categoryService.categories.flatMap(categories => this.categories = categories);

      this._diagnosticApiService.getDetectors().subscribe(detectors => {
        detectors.forEach(detector => {
          this._features.push(<Feature>{
            id: detector.id,
            description: detector.description,
            category: detector.category,
            featureType: FeatureTypes.Detector,
            name: detector.name,
            clickAction: () => {
              this._router.navigateByUrl(`new${startupInfo.resourceId}/detectors/${detector.id}`);
            }
            
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
            clickAction: () => {
              window.open(article.link, '_blank');
            }
          });
        });
      });

      this.getLegacyAvailabilityAndPerformanceFeatures(startupInfo.resourceId).forEach(feature => this._features.push(feature));
    });
  }

  getFeaturesForCategory(category: Category) {
    return this._features.filter(feature => feature.category === category.name);
  }

  getLegacyAvailabilityAndPerformanceFeatures(resourceId: string): Feature[] {
    resourceId = resourceId.startsWith('/') ? resourceId.replace('/', '') : resourceId;
    resourceId = resourceId.replace("/providers/microsoft.web", "");
    return <Feature[]>[
      {
        id: 'appanalysis',
        name: 'Web App Down',
        category: 'Availability and Performance',
        description: 'Analyze availability of web app',
        featureType: FeatureTypes.Detector,
        clickAction: () => {
          this._router.navigateByUrl(`${resourceId}/diagnostics/availability/analysis`);
        }
      },
      {
        id: 'perfanalysis',
        name: 'Web App Slow',
        category: 'Availability and Performance',
        description: 'Analyze performance of web app',
        featureType: FeatureTypes.Detector,
        clickAction: () => {
          this._router.navigateByUrl(`${resourceId}/diagnostics/performance/analysis`);
        }
      },
      {
        id: 'cpuanalysis',
        name: 'High CPU Usage',
        category: 'Availability and Performance',
        description: 'Analyze CPU Usage of your Web App on all instances and see breakdown of usage of all Web Apps on your server farm',
        featureType: FeatureTypes.Detector,
        clickAction: () => {
          this._router.navigateByUrl(`${resourceId}/diagnostics/availability/detectors/sitecpuanalysis`);
        }
      },
      {
        id: 'memoryanalysis',
        name: 'High Memory Usage',
        category: 'Availability and Performance',
        description: 'Analyze Memory Usage of your Web App including physical memory, committed memory usage, and page file operations',
        featureType: FeatureTypes.Detector,
        clickAction: () => {
          this._router.navigateByUrl(`${resourceId}/diagnostics/availability/memoryanalysis`);
        }
      },
      {
        id: 'restartanalysis',
        name: 'Web App Restarted',
        category: 'Availability and Performance',
        description: 'See timeline of Web App restarts as well as the cause of the restart',
        featureType: FeatureTypes.Detector,
        clickAction: () => {
          this._router.navigateByUrl(`${resourceId}/diagnostics/availability/apprestartanalysis`);
        }
      },
      {
        id: 'tcpconnectionsanalysis',
        name: 'TCP Connections',
        category: 'Availability and Performance',
        description: 'See TCP connection usage and analyze any socket related issues with your Web App',
        featureType: FeatureTypes.Detector,
        clickAction: () => {
          this._router.navigateByUrl(`${resourceId}/diagnostics/availability/tcpconnectionsanalysis`);
        }
      }
    ]
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
