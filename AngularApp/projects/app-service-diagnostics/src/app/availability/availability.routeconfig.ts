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
import { DetectorLoaderComponent } from './detector-view/detector-loader/detector-loader.component';
import { RerouteResolver } from './reroute/reroute.resolver';
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
        // component: DetectorViewMainComponent,
        children: DetectorViewRouteConfig,
        
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'appDownAnalysis'
        },
    },
    {
        path: 'detectors/sitecpuanalysis/focus',
        // component: DetectorLoaderComponent,
        // data: {
        //     navigationTitle: 'CPU Analysis',
        //     detectorComponent: SiteCpuAnalysisDetectorComponent
        // }
        
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'webappcpu'
        }
    }
];

const PerformanceCommonRouteConfig: Route[] = [
    {
        path: 'detectors',
        // component: DetectorViewMainComponent,
        children: DetectorViewRouteConfig,

        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'perfAnalysis'
        },
    },
    {
        path: 'detectors/sitecpuanalysis/focus',
        // component: DetectorLoaderComponent,
        // data: {
        //     navigationTitle: 'CPU Analysis',
        //     detectorComponent: SiteCpuAnalysisDetectorComponent
        // }
        
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'webappcpu'
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
        path: 'diagnostics/availability/analysis',
        // component: PerfAnalysisComponent,
        // data: {
        //     navigationTitle: 'App Performance Analysis',
        //     cacheComponent: true
        // }

        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'appDownAnalysis'
        }      
    },

    // Web App Performance Analysis
    {
        path: 'diagnostics/performance/analysis',
        // component: PerfAnalysisComponent,
        // data: {
        //     navigationTitle: 'App Performance Analysis',
        //     cacheComponent: true
        // }

        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'perfAnalysis'
        }  
    },

    // Web App Restart Analysis
    {
        path: 'diagnostics/availability/apprestartanalysis',
        // component: WebAppRestartComponent,
        // data: {
        //     navigationTitle: 'App Restart Analysis',
        //     cacheComponent: true
        // }

        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'webapprestart'
        }
    },

    // Memory Analysis
    {
        path: 'diagnostics/availability/memoryanalysis',
        // component: MemoryAnalysisComponent,
        // data: {
        //     navigationTitle: 'Memory Analysis',
        //     cacheComponent: true
        // }
        
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'Memoryusage'
        }
    },

    // TCP Connections Analysis
    {
        path: 'diagnostics/availability/tcpconnectionsanalysis',
        component: TcpConnectionsAnalysisComponent,
        data: {
            navigationTitle: 'TCP Connections Analysis',
            cacheComponent: true
        }
    },

    {
        path: 'diagnostics/availability',
        children: AvailabilityCommonRouteConfig
    },

    // Web App Slow
    {
        path: 'diagnostics/performance',
        children: PerformanceCommonRouteConfig
    },
];