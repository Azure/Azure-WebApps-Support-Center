import { Injectable } from '@angular/core';
import { Category } from '../models/category';
import { DiagnosticService } from 'applens-diagnostics';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class CategoryService {

  public categories: BehaviorSubject<Category[]> = new BehaviorSubject<Category[]>(null);

  private _categories: Category[] = [
    {
      id: 'AvailabilityAndPerformance',
      name: 'Availability and Performance',
      description: 'Is your app experiencing downtime or slowness? Discover issues that may impact SLA, caused by your app itself or Azure.',
      keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory'],
      color: 'rgb(208, 175, 239)',
      createFlowForCategory: false
    },
    {
      id: 'ConfigurationAndManagement',
      name: 'Configuration and Management',
      description: 'Are you having issues with something that you configured specifically for you app? Find out if you misconfigured App Service features, such as backups, scaling.',
      keywords: ['Autoscale', 'Failed Backups', 'IPs'],
      color: 'rgb(249, 213, 180)',
      createFlowForCategory: true
    },
    {
      id: 'SSL',
      name: 'SSL',
      description: 'Having trouble with certificates and custom domains? Discover any issues related to SSL certificates, authentication, and domain management.',
      keywords: ['4xx Errors', 'SSL', 'Domains', 'Permissions', 'Auth', 'Cert'],
      color: 'rgb(186, 211, 245)',
      createFlowForCategory: true
    },
    {
      id: 'DiagnosticTools',
      name: 'Diagnostic Tools',
      description: 'Having trouble with certificates and custom domains? Discover any issues related to SSL certificates, authentication, and domain management.',
      keywords: ['Profiler', 'Memory Dump', 'DaaS'],
      color: 'rgb(186, 211, 245)',
      createFlowForCategory: false,
      overridePath: '/diagnostictools'
    }
  ]

  constructor(private _diagnosticApiService: DiagnosticService) {
    this._diagnosticApiService.getDetectors().subscribe(detectors => {
      
    });
    this.categories.next(this._categories);
  }

}
