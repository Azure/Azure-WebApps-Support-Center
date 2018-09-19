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
    // {
    //     path: _slotResourceUrl + 'detectors/:detectorName',
    //     component: GenericDetectorComponent,
    //     resolve: {
    //         navigationTitle: TabTitleResolver
    //     },
    //     data: {
    //         cacheComponent: true
    //     }
    // },
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
    // {
    //     path: _slotResourceUrl + 'diagnostics/availability/analysis',
    //     component: AppAnalysisComponent,
    //     data: {
    //         navigationTitle: 'App Error Analysis',
    //         cacheComponent: true
    //     }
    // },

    // Web App Performance Analysis
    {
        path: _siteResourceUrl + 'diagnostics/performance/analysis',
        component: PerfAnalysisComponent,
        data: {
            navigationTitle: 'App Performance Analysis',
            cacheComponent: true
        }
    },
    // {
    //     path: _slotResourceUrl + 'diagnostics/performance/analysis',
    //     component: PerfAnalysisComponent,
    //     data: {
    //         navigationTitle: 'App Performance Analysis',
    //         cacheComponent: true
    //     }
    // },

    // Web App Restart Analysis
    {
        path: _siteResourceUrl + 'diagnostics/availability/apprestartanalysis',
        component: WebAppRestartComponent,
        data: {
            navigationTitle: 'App Restart Analysis',
            cacheComponent: true
        }
    },
    // {
    //     path: _slotResourceUrl + 'diagnostics/availability/apprestartanalysis',
    //     component: WebAppRestartComponent,
    //     data: {
    //         navigationTitle: 'App Restart Analysis',
    //         cacheComponent: true
    //     }
    // },

    // Memory Analysis
    {
        path: _siteResourceUrl + 'diagnostics/availability/memoryanalysis',
        component: MemoryAnalysisComponent,
        data: {
            navigationTitle: 'Memory Analysis',
            cacheComponent: true
        }
    },
    // {
    //     path: _slotResourceUrl + 'diagnostics/availability/memoryanalysis',
    //     component: MemoryAnalysisComponent,
    //     data: {
    //         navigationTitle: 'Memory Analysis',
    //         cacheComponent: true
    //     }
    // },
    // TCP Connections Analysis
    {
        path: _siteResourceUrl + 'diagnostics/availability/tcpconnectionsanalysis',
        component: TcpConnectionsAnalysisComponent,
        data: {
            navigationTitle: 'TCP Connections Analysis',
            cacheComponent: true
        }
    },
    // {
    //     path: _slotResourceUrl + 'diagnostics/availability/tcpconnectionsanalysis',
    //     component: TcpConnectionsAnalysisComponent,
    //     data: {
    //         navigationTitle: 'TCP Connections Analysis',
    //         cacheComponent: true
    //     }
    // },
    {
        path: _siteResourceUrl + 'diagnostics/availability',
        children: AvailabilityCommonRouteConfig
    },
    // {
    //     path: _slotResourceUrl + 'diagnostics/availability',
    //     children: AvailabilityCommonRouteConfig
    // },

    // Web App Slow
    {
        path: _siteResourceUrl + 'diagnostics/performance',
        children: PerformanceCommonRouteConfig
    },
    // {
    //     path: _slotResourceUrl + 'diagnostics/performance',
    //     children: PerformanceCommonRouteConfig
    // },

    // Service Incident Summary
    {
        path: _siteResourceUrl + 'diagnostics/incidents',
        component: IncidentSummaryComponent,
        data: {
            navigationTitle: 'Service Incidents',
            cacheComponent: true
        }
    },
    // {
    //     path: _slotResourceUrl + 'diagnostics/incidents',
    //     component: IncidentSummaryComponent,
    //     data: {
    //         navigationTitle: 'Service Incidents',
    //         cacheComponent: true
    //     }
    // },
    {
        path: 'diagnostics/tools',
        loadChildren: 'app/diagnostic-tools/diagnostic-tools.module#DiagnosticToolsModule'
    }

    // // CLR Profiling Tool
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/profiler',
    //     component: ProfilerToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.Profiler,
    //         cacheComponent: true
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/profiler',
    //     component: ProfilerToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.Profiler,
    //         cacheComponent: true
    //     }
    // },

    // // Memory Dump
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/memorydump',
    //     component: MemoryDumpToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.MemoryDump,
    //         cacheComponent: true
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/memorydump',
    //     component: MemoryDumpToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.MemoryDump,
    //         cacheComponent: true
    //     }
    // },    
    // // Java Thread Dump
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/javathreaddump',
    //     component: JavaThreadDumpToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.JavaThreadDump,
    //         cacheComponent: true
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/javathreaddump',
    //     component: JavaThreadDumpToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.JavaThreadDump,
    //         cacheComponent: true
    //     }
    // },
    // // Java Memory Dump
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/javamemorydump',
    //     component: JavaMemoryDumpToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.JavaMemoryDump,
    //         cacheComponent: true
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/javamemorydump',
    //     component: JavaMemoryDumpToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.JavaMemoryDump,
    //         cacheComponent: true
    //     }
    // },
    
    // // HTTP Log Analyzer 
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/httploganalyzer',
    //     component: HttpLogAnalysisToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.HttpLogAnalyzer,
    //         cacheComponent: true
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/httploganalyzer',
    //     component: HttpLogAnalysisToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.HttpLogAnalyzer,
    //         cacheComponent: true
    //     }
    // },
    // // PHP Log Analyzer 
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/phploganalyzer',
    //     component: PhpLogsAnalyzerToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.PHPLogAnalyzer,
    //         cacheComponent: true
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/phploganalyzer',
    //     component: PhpLogsAnalyzerToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.PHPLogAnalyzer,
    //         cacheComponent: true
    //     }
    // }
    // ,
    // // PHP Process Analyzer 
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/phpprocessanalyzer',
    //     component: PhpProcessAnalyzerToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.PHPProcessAnalyzer,
    //         cacheComponent: true
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/phpprocessanalyzer',
    //     component: PhpProcessAnalyzerToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.PHPProcessAnalyzer,
    //         cacheComponent: true
    //     }
    // }
    // ,
    // // Database Test Tool
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/databasetester',
    //     component: ConnectionDiagnoserToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.DatabaseTester,
    //         cacheComponent: true
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/databasetester',
    //     component: ConnectionDiagnoserToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.DatabaseTester,
    //         cacheComponent: true
    //     }
    // }
    // ,
    // // Autohealing
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/mitigate',
    //     component: AutohealingComponent,
    //     data: {
    //         navigationTitle: 'Mitigate',
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/mitigate',
    //     component: AutohealingComponent,
    //     data: {
    //         navigationTitle: 'Mitigate',
    //     }
    // }
    // ,    
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/networktrace',
    //     component: NetworkTraceToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.NetworkTrace,
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/networktrace',
    //     component: NetworkTraceToolComponent,
    //     data: {
    //         navigationTitle: ToolNames.NetworkTrace,
    //     }
    // }
    // ,    
    // // Diagnostics
    // {
    //     path: _siteResourceUrl + 'diagnostics/tools/daas',
    //     component: DaasMainComponent,
    //     data: {
    //         navigationTitle: ToolNames.Diagnostics,
    //         cacheComponent: true
    //     }
    // },
    // {
    //     path: _slotResourceUrl + 'diagnostics/tools/daas',
    //     component: DaasMainComponent,
    //     data: {
    //         navigationTitle: ToolNames.Diagnostics,
    //         cacheComponent: true
    //     }
    // }

];