import { WebSiteFilter } from './../pipes/site-filter.pipe';
import { Injectable } from '@angular/core';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { OperatingSystem, HostingEnvironmentKind } from '../../../shared/models/site';
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
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'WindowsAvailabilityAndPerformance',
        name: 'Availability and Performance',
        description: 'Is your app experiencing downtime or slowness? Click here to run a health checkup to discover issues that may be affect your app’s high availability, by either platform or app issues. ',
        keywords: ['Health Check', 'Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: false,
        chatEnabled: false
      }
    },
    // Linux
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'LinuxAvailabilityAndPerformance',
        name: 'Availability and Performance',
        description: 'Is your app experiencing downtime or slowness? Discover issues that may impact SLA, caused by your app itself or Azure.',
        keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: false,
        chatEnabled: false
      }
    },
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows | OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'ConfigurationAndManagement',
        name: 'Configuration and Management',
        description: 'Are you having issues with something that you configured specifically for your app? Find out if you misconfigured App Service features, such as backups, deployment slots, and scaling.',
        keywords: ['Scaling', 'Swaps', 'Failed Backups', 'IPs', 'Migration'],
        color: 'rgb(249, 213, 180)',
        createFlowForCategory: true,
        chatEnabled: false
      }
    },
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'SSLandDomains',
        name: 'SSL and Domains',
        description: 'Having trouble with certificates and custom domains? Discover any issues related to SSL certificates, authentication, and domain management.',
        keywords: ['4xx Errors', 'SSL', 'Domains', 'Permissions', 'Auth', 'Cert'],
        color: 'rgb(186, 211, 245)',
        createFlowForCategory: true,
        chatEnabled: true
      }
    },
    //Windows and Linux
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows | OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'BestPractices',
        name: 'Best Practices',
        description: 'Are you running your application in production? Review best practice recommendations to best ensure that you running your production application with the optimal configurations and suggestions.',
        keywords: ['AutoScale', 'Traffic Manager', 'AlwaysOn', 'ARR Affinity'],
        color: 'rgb(208, 228, 176)',
        createFlowForCategory: true,
        chatEnabled: false
      }
    },

    // Function App
    {
      appType: AppType.FunctionApp,
      platform: OperatingSystem.windows | OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'FunctionsAvailabilityAndPerformance',
        name: 'Availability and Performance',
        description: 'Is your Function App performing slower than normal? Investigate performance issues or just check the health of your Function App.',
        keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory', 'Slowness'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: true,
        chatEnabled: false
      }
    },
    //Separate tile for Navigator for Windows Web App
    {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows,
        stack: '',
        sku: Sku.All,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        item: {
            id: 'navigator',
            name: 'Navigator (Preview)',
            description: 'Are you having issues after making changes on your app and its dependencies? Review Navigator to investigate the recent changes in your app and dependencies.',
            keywords: ['Dependency Map', 'Changes', 'Dependency', 'Change Analysis'],
            color: 'rgb(255, 217, 119)',
            createFlowForCategory: false,
            chatEnabled: false,
            overridePath: `resource${this._resourceService.resourceIdForRouting}/detectors/navigator`
        }
    }
  ];

  constructor(private _resourceService: WebSitesService, private _websiteFilter: WebSiteFilter) {
    super();
    this._sitesCategories.push(this._getDiagnosticToolsCategory(this._resourceService.resourceIdForRouting));
    this._addCategories(
      this._websiteFilter.transform(this._sitesCategories)
    );
  }

  private _getDiagnosticToolsCategory(siteId: string): SiteFilteredItem<Category> {
    return <SiteFilteredItem<Category>>{
      appType: AppType.WebApp | AppType.FunctionApp,
      platform: OperatingSystem.windows,
      stack: '',
      sku: Sku.NotDynamic,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'DiagnosticTools',
        name: 'Diagnostic Tools',
        description: 'Sometimes deeper investigation is necessary. With Diagnostic Tools, you can run language-specific tools to profile your app, collect network traces, memory dumps, and more.',
        keywords: ['Profiler', 'Memory Dump', 'DaaS', 'AutoHeal', 'Metrics', 'Security'],
        color: 'rgb(170, 192, 208)',
        createFlowForCategory: false,
        overridePath: `resource${siteId}/diagnosticTools`
      }
    };
  }
}
