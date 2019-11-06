import { Injectable } from '@angular/core';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { DiagnosticService } from 'diagnostic-data';
import { ContentService } from '../../../shared-v2/services/content.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../startup/services/auth.service';
import { Feature, FeatureTypes } from '../../../shared-v2/models/features';
import { AppType, SupportBladeDefinitions } from '../../../shared/models/portal';
import { OperatingSystem, Site, HostingEnvironmentKind } from '../../../shared/models/site';
import { SiteFilteredItem } from '../models/site-filter';
import { Sku } from '../../../shared/models/server-farm';
import { ToolNames } from '../../../shared/models/tools-constants';
import { PortalActionService } from '../../../shared/services/portal-action.service';
import { WebSitesService } from './web-sites.service';
import { WebSiteFilter } from '../pipes/site-filter.pipe';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';

@Injectable()
export class SiteFeatureService extends FeatureService {

  public diagnosticTools: SiteFilteredItem<Feature>[];
  public proactiveTools: SiteFilteredItem<Feature>[];
  public supportTools: SiteFilteredItem<Feature>[];
  public premiumTools: SiteFilteredItem<Feature>[];

  constructor(protected _diagnosticApiService: DiagnosticService, protected _resourceService: WebSitesService, protected _contentService: ContentService, protected _router: Router,
    protected _authService: AuthService, private _portalActionService: PortalActionService, private _websiteFilter: WebSiteFilter, protected _logger: LoggingV2Service) {

    super(_diagnosticApiService, _contentService, _router, _authService, _logger);

    this._featureDisplayOrder = [{
        category: "Availability and Performance",
        platform: OperatingSystem.windows,
        appType: AppType.WebApp,
        order: ['appdownanalysis', 'perfanalysis', 'webappcpu', 'memoryusage', 'webapprestart'].reverse()
      }];

    this._authService.getStartupInfo().subscribe(startupInfo => {

      // removing v2 detectors for Availability and Perf
      // if (this._resourceService.appType == AppType.WebApp && this._resourceService.platform == OperatingSystem.windows) {
      //   this.getLegacyAvailabilityAndPerformanceFeatures(startupInfo.resourceId).forEach(feature => this._features.push(feature));
      // }
      this.addDiagnosticTools(startupInfo.resourceId);
      this.addProactiveTools(startupInfo.resourceId);
      this.addPremiumTools();
    });
  }

  sortFeatures() {
    let featureDisplayOrder = this._featureDisplayOrder;

    featureDisplayOrder.forEach(feature => {

      if (feature.platform === this._resourceService.platform && this._resourceService.appType === feature.appType) {
        // Add all the features for this category to a temporary array
        let categoryFeatures: Feature[] = [];
        this._features.forEach(x => {
          if (x.category != null && x.category.indexOf(feature.category) > -1) {
            categoryFeatures.push(x);
          }
        });

        // Remove all the features for the sorted category
        this._features = this._features.filter(x => {
          return x.category !== feature.category;
        });

        // Sort all the features for this category
        categoryFeatures.sort(
          function (a, b) {
            let categoryOrder = featureDisplayOrder.find(x => x.category.toLowerCase().startsWith(feature.category.toLowerCase()));
            if (categoryOrder != null) {
              if (categoryOrder.order.indexOf(a.id.toLowerCase()) < categoryOrder.order.indexOf(b.id.toLowerCase())) {
                return 1;
              } else if (categoryOrder.order.indexOf(b.id.toLowerCase()) === categoryOrder.order.indexOf(a.id.toLowerCase())) {
                return 0;
              }
              else {
                return -1;
              }
            }
          }
        );

        // add the sorted features for this category back to the array
        this._features = this._features.concat(categoryFeatures);
      }
    });

  }


  getLegacyAvailabilityAndPerformanceFeatures(resourceId: string): Feature[] {
    resourceId = resourceId.startsWith('/') ? resourceId.replace('/', '') : resourceId;
    return <Feature[]>[
      {
        id: 'appanalysis',
        name: 'Web App Down',
        category: 'Availability and Performance',
        description: 'Analyze availability of web app',
        featureType: FeatureTypes.Detector,
        clickAction: this._createFeatureAction('appanalysis', 'Availability and Performance', () => {
          this._router.navigateByUrl(`resource/${resourceId}/legacy/diagnostics/availability/analysis`);
        })
      },
      {
        id: 'perfanalysis',
        name: 'Web App Slow',
        category: 'Availability and Performance',
        description: 'Analyze performance of web app',
        featureType: FeatureTypes.Detector,
        clickAction: this._createFeatureAction('perfanalysis', 'Availability and Performance', () => {
          this._router.navigateByUrl(`resource/${resourceId}/legacy/diagnostics/performance/analysis`);
        })
      },
      {
        id: 'cpuanalysis',
        name: 'High CPU Usage',
        category: 'Availability and Performance',
        description: 'Analyze CPU Usage of your Web App on all instances and see breakdown of usage of all Web Apps on your server farm',
        featureType: FeatureTypes.Detector,
        clickAction: this._createFeatureAction('cpuanalysis', 'Availability and Performance', () => {
          this._router.navigateByUrl(`resource/${resourceId}/legacy/diagnostics/availability/detectors/sitecpuanalysis`);
        })
      },
      {
        id: 'memoryanalysis',
        name: 'High Memory Usage',
        category: 'Availability and Performance',
        description: 'Analyze Memory Usage of your Web App including physical memory, committed memory usage, and page file operations',
        featureType: FeatureTypes.Detector,
        clickAction: this._createFeatureAction('memoryanalysis', 'Availability and Performance', () => {
          this._router.navigateByUrl(`resource/${resourceId}/legacy/diagnostics/availability/memoryanalysis`);
        })
      }
    ];
  }

  addPremiumTools() {
    this.premiumTools = <SiteFilteredItem<Feature>[]>[
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: 'tinfoil',
          name: 'Security Scanning',
          category: 'Premium Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction('tinfoil', 'Premium Tools', () => {
            this._portalActionService.openTifoilSecurityBlade();
          })
        }
      }
    ];
  }

  addProactiveTools(resourceId: string) {
    this.proactiveTools = [
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolNames.AutoHealing,
          name: ToolNames.AutoHealing,
          category: 'Proactive Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.AutoHealing, 'Proactive Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/mitigate`);
          })
        }
      }, {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolNames.CpuMonitoring,
          name: ToolNames.CpuMonitoring,
          category: 'Proactive Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.CpuMonitoring, 'Proactive Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/cpumonitoring`);
          })
        }
      }
    ];
  }
  addDiagnosticTools(resourceId: string) {
    this.diagnosticTools = [
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'ASP.NET',
        item: {
          id: ToolNames.Profiler,
          name: ToolNames.Profiler,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.Profiler, 'Diagnostic Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/profiler`);
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'ASP.NET Core',
        item: {
          id: ToolNames.Profiler,
          name: ToolNames.Profiler,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.Profiler, 'Diagnostic Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/profiler`);
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolNames.MemoryDump,
          name: ToolNames.MemoryDump,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.MemoryDump, 'Diagnostic Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/memorydump`);
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolNames.DatabaseTester,
          name: ToolNames.DatabaseTester,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.DatabaseTester, 'Diagnostic Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/databasetester`);
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolNames.NetworkTrace,
          name: ToolNames.NetworkTrace,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.NetworkTrace, 'Diagnostic Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/networktrace`);
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'PHP',
        item: {
          id: ToolNames.PHPLogAnalyzer,
          name: ToolNames.PHPLogAnalyzer,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.PHPLogAnalyzer, 'Diagnostic Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/phploganalyzer`);
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'PHP',
        item: {
          id: ToolNames.PHPProcessAnalyzer,
          name: ToolNames.PHPProcessAnalyzer,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.PHPProcessAnalyzer, 'Diagnostic Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/phpprocessanalyzer`);
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'Java',
        item: {
          id: ToolNames.JavaMemoryDump,
          name: ToolNames.JavaMemoryDump,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.JavaMemoryDump, 'Diagnostic Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/javamemorydump`);
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'Java',
        item: {
          id: ToolNames.JavaThreadDump,
          name: ToolNames.JavaThreadDump,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.JavaThreadDump, 'Diagnostic Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/javathreaddump`);
          })
        }
      },
    ];

    this.supportTools = [
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: SupportBladeDefinitions.MetricPerInstance.Identifier,
          name: 'Metrics per Instance (Apps)',
          category: 'Support Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.MetricPerInstance.Identifier, 'Support Tools', () => {
            this._portalActionService.openMdmMetricsV3Blade();
          })
        }
      },
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows,
        sku: Sku.Paid,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: SupportBladeDefinitions.AppServicePlanMetrics.Identifier,
          name: 'Metrics per Instance (App Service Plan)',
          category: 'Support Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.AppServicePlanMetrics.Identifier, 'Support Tools', () => {
            this._portalActionService.openMdmMetricsV3Blade(this._resourceService.resource.properties.serverFarmId);
          })
        }
      },
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: SupportBladeDefinitions.EventViewer.Identifier,
          name: 'Application Event Logs',
          category: 'Support Tools',
          description: 'View event logs(containing exceptions, errors etc) generated by your application.',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.EventViewer.Identifier, 'Support Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/eventviewer`);
          })
        }
      },
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: SupportBladeDefinitions.FREBLogs.Identifier,
          name: 'Failed Request Tracing Logs',
          category: 'Support Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.FREBLogs.Identifier, 'Support Tools', () => {
            this._router.navigateByUrl(`resource${resourceId}/tools/frebviewer`);
          })
        }
      },
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows,
        sku: Sku.Paid,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: 'AdvancedAppRestart',
          name: 'Advanced Application Restart',
          category: 'Support Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction('AdvancedAppRestart', 'Support Tools', () => {
            this._portalActionService.openBladeAdvancedAppRestartBladeForCurrentSite();
          })
        }
      }
    ];

    this._websiteFilter.transform(this.diagnosticTools).forEach(tool => {
      this._features.push(tool);
    });

    this._websiteFilter.transform(this.supportTools).forEach(tool => {
      this._features.push(tool);
    });
  }
}
