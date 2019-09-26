import { ToolNames } from '../shared/models/tools-constants';
import { ProfilerToolComponent } from '../shared/components/tools/profiler-tool/profiler-tool.component';
import { MemoryDumpToolComponent } from '../shared/components/tools/memorydump-tool/memorydump-tool.component';
import { JavaThreadDumpToolComponent } from '../shared/components/tools/java-threaddump-tool/java-threaddump-tool.component';
import { JavaMemoryDumpToolComponent } from '../shared/components/tools/java-memorydump-tool/java-memorydump-tool.component';
import { HttpLogAnalysisToolComponent } from '../shared/components/tools/http-loganalysis-tool/http-loganalysis-tool.component';
import { PhpLogsAnalyzerToolComponent } from '../shared/components/tools/php-logsanalyzer-tool/php-logsanalyzer-tool.component';
import { PhpProcessAnalyzerToolComponent } from '../shared/components/tools/php-processanalyzer-tool/php-processanalyzer-tool.component';
import { ConnectionDiagnoserToolComponent } from '../shared/components/tools/connection-diagnoser-tool/connection-diagnoser-tool.component';
import { AutohealingComponent } from '../auto-healing/autohealing.component';
import { NetworkTraceToolComponent } from '../shared/components/tools/network-trace-tool/network-trace-tool.component';
import { DaasMainComponent } from '../shared/components/daas-main/daas-main.component';
import { Route } from '@angular/router';
import { AutohealingDetectorComponent } from '../availability/detector-view/detectors/autohealing-detector/autohealing-detector.component';
import { CpuMonitoringToolComponent } from '../shared/components/tools/cpu-monitoring-tool/cpu-monitoring-tool.component';
import { EventViewerComponent } from '../shared/components/daas/event-viewer/event-viewer.component';
import { FrebViewerComponent } from '../shared/components/daas/freb-viewer/freb-viewer.component';

export const DiagnosticToolsRoutes: Route[] = [
    // CLR Profiling Tool
    {
        path: 'profiler',
        component: ProfilerToolComponent,
        data: {
            navigationTitle: ToolNames.Profiler,
            cacheComponent: true
        }
    },
    // Memory Dump
    {
        path: 'memorydump',
        component: MemoryDumpToolComponent,
        data: {
            navigationTitle: ToolNames.MemoryDump,
            cacheComponent: true
        }
    },
    // Java Thread Dump
    {
        path: 'javathreaddump',
        component: JavaThreadDumpToolComponent,
        data: {
            navigationTitle: ToolNames.JavaThreadDump,
            cacheComponent: true
        }
    },
    // Java Memory Dump
    {
        path: 'javamemorydump',
        component: JavaMemoryDumpToolComponent,
        data: {
            navigationTitle: ToolNames.JavaMemoryDump,
            cacheComponent: true
        }
    },
    // HTTP Log Analyzer
    {
        path: 'httploganalyzer',
        component: HttpLogAnalysisToolComponent,
        data: {
            navigationTitle: ToolNames.HttpLogAnalyzer,
            cacheComponent: true
        }
    },
    // PHP Log Analyzer
    {
        path: 'phploganalyzer',
        component: PhpLogsAnalyzerToolComponent,
        data: {
            navigationTitle: ToolNames.PHPLogAnalyzer,
            cacheComponent: true
        }
    },
    // PHP Process Analyzer
    {
        path: 'phpprocessanalyzer',
        component: PhpProcessAnalyzerToolComponent,
        data: {
            navigationTitle: ToolNames.PHPProcessAnalyzer,
            cacheComponent: true
        }
    },
    // Database Test Tool
    {
        path: 'databasetester',
        component: ConnectionDiagnoserToolComponent,
        data: {
            navigationTitle: ToolNames.DatabaseTester,
            cacheComponent: true
        }
    },
    // CPU Monitoring tool
    {
        path: 'cpumonitoring',
        component: CpuMonitoringToolComponent,
        data: {
            navigationTitle: ToolNames.CpuMonitoring,
            cacheComponent: true
        }
    },
    // Autohealing
    {
        path: 'mitigate',
        component: AutohealingComponent,
        data: {
            navigationTitle: 'Mitigate',
            detectorComponent: AutohealingDetectorComponent
        }
    },
    // Network Trace
    {
        path: 'networktrace',
        component: NetworkTraceToolComponent,
        data: {
            navigationTitle: ToolNames.NetworkTrace,
            cacheComponent: true
        }
    },
    // Diagnostics
    {
        path: 'daas',
        component: DaasMainComponent,
        data: {
            navigationTitle: ToolNames.Diagnostics,
            cacheComponent: true
        }
    },
    // Event Viewer
    {
        path: 'eventviewer',
        component: EventViewerComponent,
        data: {
            navigationTitle: ToolNames.EventViewer,
            cacheComponent: true
        }
    },
    // Freb Viewer
    {
        path: 'frebviewer',
        component: FrebViewerComponent,
        data: {
            navigationTitle: ToolNames.FrebViewer,
            cacheComponent: true
        }
    },
];
