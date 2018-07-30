import { Injectable } from '@angular/core';
import { Category } from '../models/category';
import { DiagnosticService } from '../../../../node_modules/applens-diagnostics';
import { BehaviorSubject } from '../../../../node_modules/rxjs';

@Injectable()
export class CategoryService {

  public categories: BehaviorSubject<Category[]> = new BehaviorSubject<Category[]>(null);

  private _categories: Category[] = [
    {
      id: 'AvailabilityAndPerformance',
      name: 'Availability and Performance',
      description: 'Is your app experiencing downtime or slowness? Discover issues that may impact SLA, caused by your app itself or Azure.',
      keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory'],
      color: 'rgb(208, 175, 239)'
    },
    {
      id: 'ConfigurationAndManagement',
      name: 'Configuration and Management',
      description: 'Are you having issues with something that you configured specifically for you app? Find out if you misconfigured App Service features, such as backups, scaling.',
      keywords: ['Autoscale', 'Failed Backups', 'IPs'],
      color: 'rgb(249, 213, 180)'
    },
    {
      id: 'SSL',
      name: 'SSL',
      description: 'Having trouble with certificates and custom domains? Discover any issues related to SSL certificates, authentication, and domain management.',
      keywords: ['4xx Errors', 'SSL', 'Domains', 'Permissions', 'Auth', 'Cert'],
      color: 'rgb(186, 211, 245)'
    }
  ]

  constructor(private _diagnosticApiService: DiagnosticService) {
    this._diagnosticApiService.getDetectors().subscribe(detectors => {
      
    });
    this.categories.next(this._categories);
  }

}
