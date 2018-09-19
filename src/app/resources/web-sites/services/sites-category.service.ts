import { Injectable } from '@angular/core';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { OperatingSystem } from '../../../shared/models/site';
import { AppType } from '../../../shared/models/portal';
import { SiteFilteredItem } from '../models/site-filter';
import { Sku } from '../../../shared/models/server-farm';
import { WebSitesService } from './web-sites.service';

@Injectable()
export class SitesCategoryService extends CategoryService {

  private _sitesCategories: SiteFilteredItem<Category>[] = [
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows,
      stack: '',
      sku: Sku.All,
      item: {
        id: 'AvailabilityAndPerformance',
        name: 'Availability and Performance',
        description: 'Is your app experiencing downtime or slowness? Click here to run a health checkup to discover issues that may be affect your app’s high availability, by either platform or app issues. ',
        keywords: ['Health Check', 'Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: false
      }
    },
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows | OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      item: {
        id: 'ConfigurationAndManagement',
        name: 'Configuration and Management',
        description: 'Are you having issues with something that you configured specifically for your app? Find out if you misconfigured App Service features, such as backups, deployment slots, and scaling.',
        keywords: ['Autoscale', 'Failed Backups', 'IPs'],
        color: 'rgb(249, 213, 180)',
        createFlowForCategory: true
      }
    },
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows,
      stack: '',
      sku: Sku.All,
      item: {
        id: 'SSLandDomains',
        name: 'SSL and Domains',
        description: 'Having trouble with certificates and custom domains? Discover any issues related to SSL certificates, authentication, and domain management.',
        keywords: ['4xx Errors', 'SSL', 'Domains', 'Permissions', 'Auth', 'Cert'],
        color: 'rgb(186, 211, 245)',
        createFlowForCategory: true
      }
    },
    // Linux
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      item: {
        id: 'AvailabilityAndPerformance',
        name: 'Availability and Performance',
        description: 'Is your app experiencing downtime or slowness? Discover issues that may impact SLA, caused by your app itself or Azure.',
        keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: true
      }
    },
    // Function App
    {
      appType: AppType.FunctionApp,
      platform: OperatingSystem.windows | OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      item: {
        id: 'AvailabilityAndPerformance',
        name: 'Availability and Performance',
        description: 'Is your Function App performing slower than normal? Investigate performance issues or just check the health of your Function App.',
        keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory', 'Slowness'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: true
      }
    },
    {
      appType: AppType.FunctionApp,
      platform: OperatingSystem.windows | OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      item: {
        id: 'FunctionsPerformance',
        name: 'Functions Performance',
        description: 'Is your Function App performing slower than normal? Investigate performance issues or just check the health of your Function App.',
        keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory', 'Slowness'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: true
      }
    }
    
  ]

  constructor(private _resourceService: WebSitesService) {
    super();
    this._sitesCategories.push(this._getDiagnosticToolsCategory(this._resourceService.resourceIdForRouting));
    this._addCategories(
      this._sitesCategories
      .filter(
        siteCategory => siteCategory.appType & this._resourceService.appType && 
        siteCategory.platform & this._resourceService.platform)
      .map(siteCategory => siteCategory.item));
  }

  private _getDiagnosticToolsCategory(siteId: string): SiteFilteredItem<Category> {
    return <SiteFilteredItem<Category>>{
      appType: AppType.WebApp,
      platform: OperatingSystem.windows,
      stack: '',
      sku: Sku.All,
      item: {
        id: 'DiagnosticTools',
        name: 'Diagnostic Tools',
        description: 'Having trouble with certificates and custom domains? Discover any issues related to SSL certificates, authentication, and domain management.',
        keywords: ['Profiler', 'Memory Dump', 'DaaS'],
        color: 'rgb(186, 211, 245)',
        createFlowForCategory: false,
        overridePath: `${siteId}/diagnosticTools`
      }
    }
  }
}
