import { ToolIds } from "../shared/models/tools-constants";
import { SupportBladeDefinitions } from "../shared/models/portal";

//All svg files name under assets/img/detectors folder
//Update once add new icons into detectors folder
export const icons: Set<string> = new Set(
    [
        //detector Id
        'appchanges',
        'appcrashes',
        'eventviewer',
        'ParentAvailabilityAndPerformance',
        'ParentConfigurationManagement',
        'CertificateBindingOperations',
        'certificatedeleteoperations',
        'certificateuploadoperations',
        'backupFailures',
        'clientcertificateloadfailures',
        'CustomDomainAddFailureOnPortal',
        'webappcpu',
        'http4xx',
        'inaccessiblecerts',
        'KeyVaultAppSettings',
        'Memoryusage',
        'Migration',
        'MinTlsVersionChecker',
        'navigator',
        'configuringsslandcustomdomains',
        'appDownAnalysis',
        'ipaddressrestrictions',

        //Tools

        //Proactive Tools
        ToolIds.AutoHealing,
        ToolIds.CpuMonitoring,
        ToolIds.CrashMonitoring,

        //Diagnostic Tools
        ToolIds.Profiler,
        ToolIds.MemoryDump,
        ToolIds.DatabaseTester,
        ToolIds.NetworkTrace,
        ToolIds.PHPLogAnalyzer,
        ToolIds.JavaMemoryDump,
        ToolIds.JavaThreadDump,
        ToolIds.JavaFlightRecorder,

        //Support Tools
        ToolIds.MetricPerInstanceApp,
        ToolIds.AppServicePlanMetrics,
        ToolIds.EventViewer,
        ToolIds.FrebViewer,
        ToolIds.AdvancedAppRestart,
    ]
);
