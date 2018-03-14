import { Route } from '@angular/router';

import { AvailabilityComponent } from './availability.component';
import { AppAnalysisComponent } from './analysis/app-analysis.component';
import { PerfAnalysisComponent } from './analysis/perf-analysis.component';
import { WebAppRestartComponent } from './analysis/webapprestart/webapprestart.component';
import { MemoryAnalysisComponent } from './analysis/memory-analysis/memory-analysis.component';
import { DetectorViewRouteConfig } from './detector-view/detector-view.routeconfig';
import { DetectorViewMainComponent } from './detector-view/detector-view-main/detector-view-main.component';
import { SiteCpuAnalysisDetectorComponent } from './detector-view/detectors/site-cpu-analysis-detector/site-cpu-analysis-detector.component';
import { TcpConnectionsAnalysisComponent } from './analysis/tcpconnectionsanalysis/tcp-connections-analysis.component';
import { ProfilerToolComponent } from '../shared/components/tools/profiler-tool/profiler-tool.component';
import { MemoryDumpToolComponent } from '../shared/components/tools/memorydump-tool/memorydump-tool.component';
import { JavaMemoryDumpToolComponent } from '../shared/components/tools/java-memorydump-tool/java-memorydump-tool.component';
import { JavaThreadDumpToolComponent } from '../shared/components/tools/java-threaddump-tool/java-threaddump-tool.component';
import { HttpLogAnalysisToolComponent } from '../shared/components/tools/http-loganalysis-tool/http-loganalysis-tool.component';
import { PhpProcessAnalyzerToolComponent } from '../shared/components/tools/php-processanalyzer-tool/php-processanalyzer-tool.component';
import { PhpLogsAnalyzerToolComponent } from '../shared/components/tools/php-logsanalyzer-tool/php-logsanalyzer-tool.component';
import { ConnectionDiagnoserToolComponent } from '../shared/components/tools/connection-diagnoser-tool/connection-diagnoser-tool.component';
import { NetworkTraceToolComponent } from '../shared/components/tools/network-trace-tool/network-trace-tool.component';
import { IncidentSummaryComponent } from '../shared/components/incident-summary/incident-summary.component';

const _siteResourceUrl: string = 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/sites/:sitename';
const _slotResourceUrl: string = 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/sites/:sitename/slots/:slot';

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

    // Web App Error Analysis
    {
        path: _siteResourceUrl + '/diagnostics/availability/analysis',
        component: AppAnalysisComponent,
        data: {
            navigationTitle: 'App Error Analysis',
            cacheComponent: true
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/availability/analysis',
        component: AppAnalysisComponent,
        data: {
            navigationTitle: 'App Error Analysis',
            cacheComponent: true
        }
    },

    // Web App Performance Analysis
    {
        path: _siteResourceUrl + '/diagnostics/performance/analysis',
        component: PerfAnalysisComponent,
        data: {
            navigationTitle: 'App Performance Analysis',
            cacheComponent: true
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/performance/analysis',
        component: PerfAnalysisComponent,
        data: {
            navigationTitle: 'App Performance Analysis',
            cacheComponent: true
        }
    },

    // Web App Restart Analysis
    {
        path: _siteResourceUrl + '/diagnostics/availability/apprestartanalysis',
        component: WebAppRestartComponent,
        data: {
            navigationTitle: 'App Restart Analysis',
            cacheComponent: true
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/availability/apprestartanalysis',
        component: WebAppRestartComponent,
        data: {
            navigationTitle: 'App Restart Analysis',
            cacheComponent: true
        }
    },

    // Memory Analysis
    {
        path: _siteResourceUrl + '/diagnostics/availability/memoryanalysis',
        component: MemoryAnalysisComponent,
        data: {
            navigationTitle: 'Memory Analysis',
            cacheComponent: true
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/availability/memoryanalysis',
        component: MemoryAnalysisComponent,
        data: {
            navigationTitle: 'Memory Analysis',
            cacheComponent: true
        }
    },
    // TCP Connections Analysis
    {
        path: _siteResourceUrl + '/diagnostics/availability/tcpconnectionsanalysis',
        component: TcpConnectionsAnalysisComponent,
        data: {
            navigationTitle: 'TCP Connections Analysis',
            cacheComponent: true
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/availability/tcpconnectionsanalysis',
        component: TcpConnectionsAnalysisComponent,
        data: {
            navigationTitle: 'TCP Connections Analysis',
            cacheComponent: true
        }
    },
    {
        path: _siteResourceUrl + '/diagnostics/availability',
        children: AvailabilityCommonRouteConfig
    },
    {
        path: _slotResourceUrl + '/diagnostics/availability',
        children: AvailabilityCommonRouteConfig
    },

    // Web App Slow
    {
        path: _siteResourceUrl + '/diagnostics/performance',
        children: PerformanceCommonRouteConfig
    },
    {
        path: _slotResourceUrl + '/diagnostics/performance',
        children: PerformanceCommonRouteConfig
    },

    // Service Incident Summary
    {
        path: _siteResourceUrl + '/diagnostics/incidents',
        component: IncidentSummaryComponent,
        data: {
            navigationTitle: 'Service Incidents',
            cacheComponent: true
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/incidents',
        component: IncidentSummaryComponent,
        data: {
            navigationTitle: 'Service Incidents',
            cacheComponent: true
        }
    },

    // CLR Profiling Tool
    {
        path: _siteResourceUrl + '/diagnostics/tools/profiler',
        component: ProfilerToolComponent,
        data: {
            navigationTitle: 'CLR Profiler'            
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/tools/profiler',
        component: ProfilerToolComponent,
        data: {
            navigationTitle: 'CLR Profiler'
        }
    },

    // Memory Dump
    {
        path: _siteResourceUrl + '/diagnostics/tools/memorydump',
        component: MemoryDumpToolComponent,
        data: {
            navigationTitle: 'Memory Dump'
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/tools/memorydump',
        component: MemoryDumpToolComponent,
        data: {
            navigationTitle: 'Memory Dump'
        }
    },    
    // Java Thread Dump
    {
        path: _siteResourceUrl + '/diagnostics/tools/javathreaddump',
        component: JavaThreadDumpToolComponent,
        data: {
            navigationTitle: 'Java Thread Dump'
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/tools/javathreaddump',
        component: JavaThreadDumpToolComponent,
        data: {
            navigationTitle: 'Java Thread Dump'
        }
    },
    // Java Memory Dump
    {
        path: _siteResourceUrl + '/diagnostics/tools/javamemorydump',
        component: JavaMemoryDumpToolComponent,
        data: {
            navigationTitle: 'Java Memory Dump'
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/tools/javamemorydump',
        component: JavaMemoryDumpToolComponent,
        data: {
            navigationTitle: 'Java Memory Dump'
        }
    },
    
    // HTTP Log Analyzer 
    {
        path: _siteResourceUrl + '/diagnostics/tools/httploganalyzer',
        component: HttpLogAnalysisToolComponent,
        data: {
            navigationTitle: 'HTTP Log Analyzer'
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/tools/httploganalyzer',
        component: HttpLogAnalysisToolComponent,
        data: {
            navigationTitle: 'HTTP Log Analyzer'
        }
    },
    // PHP Log Analyzer 
    {
        path: _siteResourceUrl + '/diagnostics/tools/phploganalyzer',
        component: PhpLogsAnalyzerToolComponent,
        data: {
            navigationTitle: 'PHP Log Analyzer'
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/tools/phploganalyzer',
        component: PhpLogsAnalyzerToolComponent,
        data: {
            navigationTitle: 'PHP Log Analyzer'
        }
    }
    ,
    // PHP Process Analyzer 
    {
        path: _siteResourceUrl + '/diagnostics/tools/phpprocessanalyzer',
        component: PhpProcessAnalyzerToolComponent,
        data: {
            navigationTitle: 'PHP Process Analyzer'
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/tools/phpprocessanalyzer',
        component: PhpProcessAnalyzerToolComponent,
        data: {
            navigationTitle: 'PHP Process Analyzer'
        }
    }
    ,
    // Database Test Tool
    {
        path: _siteResourceUrl + '/diagnostics/tools/databasetester',
        component: ConnectionDiagnoserToolComponent,
        data: {
            navigationTitle: 'Connection Strings',
            cacheComponent: true
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/tools/databasetester',
        component: ConnectionDiagnoserToolComponent,
        data: {
            navigationTitle: 'Connection Strings',
            cacheComponent: true
        }
    }
    ,
    // Network Trace Tool
    {
        path: _siteResourceUrl + '/diagnostics/tools/networktrace',
        component: NetworkTraceToolComponent,
        data: {
            navigationTitle: 'Network Trace',            
        }
    },
    {
        path: _slotResourceUrl + '/diagnostics/tools/networktrace',
        component: NetworkTraceToolComponent,
        data: {
            navigationTitle: 'Network Trace',           
        }
    }

];