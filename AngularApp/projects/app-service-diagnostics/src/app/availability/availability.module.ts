import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { SolutionsModule } from '../solutions/solutions.module';
import { DiagnosticDataModule } from 'diagnostic-data';

import { AvailabilityComponent } from './availability.component';
import { AppCurrentHealthComponent } from './currenthealth/app-current-health.component';
import { AvailabilityGraphComponent } from './analysis/availability-graph.component';
import { ObservationsComponent } from './observations/observations.component';
import { ObservationsAvailabilityComponent } from './observations/observations-availability.component';
import { ObservationsPerformanceComponent } from './observations/observations-performance.component';
import { SolutionListComponent } from './solutions/solution-list.component';
import { AppAnalysisComponent } from './analysis/app-analysis.component';
import { PerfAnalysisComponent } from './analysis/perf-analysis.component';
import { WebAppRestartComponent } from './analysis/webapprestart/webapprestart.component';
import { MemoryAnalysisComponent } from './analysis/memory-analysis/memory-analysis.component';
import { DetectorViewBaseComponent } from './detector-view/detector-view-base/detector-view-base.component';
import { DetectorViewMainComponent } from './detector-view/detector-view-main/detector-view-main.component';
import { DetectorViewProblemComponent } from './detector-view/detector-view-problem/detector-view-problem.component';
import { DetectorViewInstanceDetailComponent } from './detector-view/detector-view-instance-detail/detector-view-instance-detail.component';
import { SiteCpuAnalysisDetectorComponent } from './detector-view/detectors/site-cpu-analysis-detector/site-cpu-analysis-detector.component';
import { SiteMemoryAnalysisDetectorComponent } from './detector-view/detectors/site-memory-analysis-detector/site-memory-analysis-detector.component';
import { ThreadDetectorComponent } from './detector-view/detectors/thread-detector/thread-detector.component';
import { FrebAnalysisDetectorComponent } from './detector-view/detectors/freb-analysis-detector/freb-analysis-detector.component';
import { PhpLogAnalyzerComponent } from './detector-view/detectors/php-log-analyzer-detector/php-log-analyzer-detector.component';
import { DockerContainerIntializationComponent } from './detector-view/detectors/docker-container-start-stop-detector/docker-container-start-stop-detector.component';
import { CommittedMemoryUsageComponent } from './detector-view/detectors/committed-memory-detector/committed-memory-detector.component';
import { PageFileOperationsComponent } from './detector-view/detectors/page-operations-detector/page-operations-detector.component';
import { ToolsMenuComponent } from './tools-menu/tools-menu.component';
import { AvailabilityAndPerformanceCategoryRouteConfig } from './availability.routeconfig';
import { AspNetCoreComponent } from "./detector-view/detectors/aspnetcore-detector/aspnetcore-detector.component";
import { AppInsightsTileComponent } from './app-insights/app-insights-tile.component';
import { AppInsightsSettingsComponent } from './app-insights/app-insights-settings.component';
import { AppInsightsExceptionsComponent } from './app-insights/exceptions/app-insights-exceptions.component';
import { AppInsightsDependenciesComponent } from './app-insights/dependencies/app-insights-dependencies.component';
import { TcpConnectionsAnalysisComponent } from './analysis/tcpconnectionsanalysis/tcp-connections-analysis.component';
import { ProblemSolutionComponent } from './problem-solution/problem-solution.component';
import { DetectorLoaderComponent } from './detector-view/detector-loader/detector-loader.component';
import { AutohealingDetectorComponent } from './detector-view/detectors/autohealing-detector/autohealing-detector.component';
import { RerouteResolver } from './reroute/reroute.resolver';

@NgModule({
    declarations: [
        AvailabilityComponent,
        DetectorViewBaseComponent,
        DetectorViewMainComponent,
        AppCurrentHealthComponent,
        AvailabilityGraphComponent,
        ObservationsComponent,
        ObservationsAvailabilityComponent,
        ObservationsPerformanceComponent,
        SolutionListComponent,
        AppAnalysisComponent,
        PerfAnalysisComponent,
        WebAppRestartComponent,
        ToolsMenuComponent,
        DetectorViewInstanceDetailComponent,
        DetectorViewProblemComponent,
        SiteCpuAnalysisDetectorComponent,
        SiteMemoryAnalysisDetectorComponent,
        ThreadDetectorComponent,
        FrebAnalysisDetectorComponent,
        PhpLogAnalyzerComponent,
        DockerContainerIntializationComponent,
        MemoryAnalysisComponent,
        CommittedMemoryUsageComponent,
        PageFileOperationsComponent,
        AspNetCoreComponent,
        TcpConnectionsAnalysisComponent,
        AppInsightsTileComponent,
        AppInsightsSettingsComponent,
        AppInsightsExceptionsComponent,
        AppInsightsDependenciesComponent,
        ProblemSolutionComponent,
        DetectorLoaderComponent,
        AutohealingDetectorComponent,
    ],
    imports: [
        RouterModule.forChild(AvailabilityAndPerformanceCategoryRouteConfig),
        SharedModule,
        SolutionsModule,
        DiagnosticDataModule
    ],
    exports: [
        ObservationsComponent,
        ObservationsAvailabilityComponent,
        ObservationsPerformanceComponent,
        DetectorViewProblemComponent,
        AppInsightsTileComponent,
        AppInsightsSettingsComponent,
        ProblemSolutionComponent,
        AutohealingDetectorComponent,
        DetectorLoaderComponent
    ],
    providers:[RerouteResolver]
})
export class AvailabilityModule {
    constructor(
    ) { }
}