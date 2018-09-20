import { Route, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AvailabilityComponent } from './availability.component';
import { AppAnalysisComponent } from './analysis/app-analysis.component';
import { PerfAnalysisComponent } from './analysis/perf-analysis.component';
import { WebAppRestartComponent } from './analysis/webapprestart/webapprestart.component';
import { MemoryAnalysisComponent } from './analysis/memory-analysis/memory-analysis.component';
import { DetectorViewRouteConfig } from './detector-view/detector-view.routeconfig';
import { DetectorViewMainComponent } from './detector-view/detector-view-main/detector-view-main.component';
import { SiteCpuAnalysisDetectorComponent } from './detector-view/detectors/site-cpu-analysis-detector/site-cpu-analysis-detector.component';
import { TcpConnectionsAnalysisComponent } from './analysis/tcpconnectionsanalysis/tcp-connections-analysis.component';
import { IncidentSummaryComponent } from '../shared/components/incident-summary/incident-summary.component';
import { GenericDetectorComponent } from '../shared/components/generic-detector/generic-detector.component';
import { TabTitleResolver } from '../shared/resolvers/tab-name.resolver';
import { SupportTopicRedirectComponent } from '../home/components/support-topic-redirect/support-topic-redirect.component';



// const _siteResourceUrl: string = 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/sites/:sitename/';
// const _slotResourceUrl: string = 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/sites/:sitename/slots/:slot/';
// const _hostingEnvironmentResourceUrl: string = 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/hostingenvironments/:name/';

const _siteResourceUrl: string = '';
const _slotResourceUrl: string = '';
const _hostingEnvironmentResourceUrl: string = '';

const AvailabilityCommonRouteConfig: Route[] = [
    {
        path: '',
        component: AvailabilityComponent,
        data: {
            navigationTitle: 'availability'
        }
    },
    {
        path: 'detectors',
        component: DetectorViewMainComponent,
        children: DetectorViewRouteConfig
    },
    {
        path: 'detectors/sitecpuanalysis/focus',
        component: SiteCpuAnalysisDetectorComponent,
        data: {
            navigationTitle: 'CPU Analysis'
        }
    }
];

const PerformanceCommonRouteConfig: Route[] = [
    {
        path: 'detectors',
        component: DetectorViewMainComponent,
        children: DetectorViewRouteConfig
    },
    {
        path: 'detectors/sitecpuanalysis/focus',
        component: SiteCpuAnalysisDetectorComponent,
        data: {
            navigationTitle: 'CPU Analysis'
        }
    }
];

export const AvailabilityAndPerformanceCategoryRouteConfig: Route[] = [

    /*
    Purposefully moving app analysis, perf analysis and restart analysis to parrent route level to enable component caching.
    Unfortunately, Component Reuse Strategy doesnt work as expected for child routes.
    See issue : https://github.com/angular/angular/issues/13869 
    */
    {
        path: _siteResourceUrl + 'detectors/:detectorName',
        component: GenericDetectorComponent,
        resolve: {
            navigationTitle: TabTitleResolver
        },
        data: {
            cacheComponent: true
        }
    },
    {
        path: _hostingEnvironmentResourceUrl + 'detectors/:detectorName',
        component: GenericDetectorComponent,
        resolve: {
            navigationTitle: TabTitleResolver
        },
        data: {
            cacheComponent: true
        }
    },
    // Web App Error Analysis
    {
        path: _siteResourceUrl + 'diagnostics/availability/analysis',
        component: AppAnalysisComponent,
        data: {
            navigationTitle: 'App Error Analysis',
            cacheComponent: true
        }
    },

    // Web App Performance Analysis
    {
        path: _siteResourceUrl + 'diagnostics/performance/analysis',
        component: PerfAnalysisComponent,
        data: {
            navigationTitle: 'App Performance Analysis',
            cacheComponent: true
        }
    },

    // Web App Restart Analysis
    {
        path: _siteResourceUrl + 'diagnostics/availability/apprestartanalysis',
        component: WebAppRestartComponent,
        data: {
            navigationTitle: 'App Restart Analysis',
            cacheComponent: true
        }
    },

    // Memory Analysis
    {
        path: _siteResourceUrl + 'diagnostics/availability/memoryanalysis',
        component: MemoryAnalysisComponent,
        data: {
            navigationTitle: 'Memory Analysis',
            cacheComponent: true
        }
    },

    // TCP Connections Analysis
    {
        path: _siteResourceUrl + 'diagnostics/availability/tcpconnectionsanalysis',
        component: TcpConnectionsAnalysisComponent,
        data: {
            navigationTitle: 'TCP Connections Analysis',
            cacheComponent: true
        }
    },

    {
        path: _siteResourceUrl + 'diagnostics/availability',
        children: AvailabilityCommonRouteConfig
    },

    // Web App Slow
    {
        path: _siteResourceUrl + 'diagnostics/performance',
        children: PerformanceCommonRouteConfig
    },

    // Service Incident Summary
    {
        path: _siteResourceUrl + 'diagnostics/incidents',
        component: IncidentSummaryComponent,
        data: {
            navigationTitle: 'Service Incidents',
            cacheComponent: true
        }
    },
    {
        path: 'diagnostics/tools',
        loadChildren: 'app/diagnostic-tools/diagnostic-tools.module#DiagnosticToolsModule'
    }
];