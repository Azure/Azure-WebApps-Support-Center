import { Injectable } from '@angular/core';
import { Category } from '../models/category';
import { DiagnosticService } from '../../../../node_modules/applens-diagnostics';

@Injectable()
export class CategoryService {

  categories: Category[] = [
    {
      id: 'AvailabilityAndPerformance',
      name: 'Availability and Performance',
      description: 'Is your app experiencing downtime or slowness? Discover issues that may impact your SLA',
      keywords: ['downtime', '5xx Errors', '4xx Errors', 'slowness', 'CPU', 'Memory']
    },
    {
      id: 'ConfigurationAndManagement',
      name: 'Configuration and Management',
      description: 'Are you having issues with something configured specifically for your app? Having issues managing your application?',
      keywords: ['downtime', '5xx Errors', '4xx Errors', 'slowness']
    }
  ]

  constructor(private _diagnosticApiService: DiagnosticService) {
    this._diagnosticApiService.getDetectors().subscribe(detectors => console.log(detectors));
  }

}
