import { Component, OnInit, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { SiteExtensions, OperatingSystem, Site } from 'projects/app-service-diagnostics/src/app/shared/models/site';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BotLoggingService } from 'projects/app-service-diagnostics/src/app/shared/services/logging/bot.logging.service';
import { SiteService } from 'projects/app-service-diagnostics/src/app/shared/services/site.service';
import { HealthStatus, LoadingStatus, DiagnosticService, DetectorControlService, DetectorResponse, Insight, InsightUtils } from 'diagnostic-data';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';

@Component({
  selector: 'health-check-v3',
  templateUrl: './health-check-v3.component.html',
  styleUrls: ['./health-check-v3.component.scss']
})
export class HealthCheckV3Component implements OnInit, AfterViewInit, IChatMessageComponent {

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

  HealthStatus = HealthStatus;
  LoadingStatus = LoadingStatus;

  subscriptionId: string;
  resourceGroup: string;
  siteName: string;
  slotName: string;

  showLoadingMessage: boolean;
  healthCheckpointsSubject: BehaviorSubject<any[]> = new BehaviorSubject(null);
  healthCheckpoints: any[];
  selectedCategoryIndex: number = 0;
  healthCheckResultForLogging: string[] = [];
  resourceId:string = "";

  currentSite: Site;

  constructor(private _route: ActivatedRoute, private _diagnosticService: DiagnosticService, public detectorControlService: DetectorControlService, private _logger: BotLoggingService, private _siteService: SiteService,
    private _router: Router) {
    this.showLoadingMessage = true;
    this._logger.LogHealthCheckInvoked();

    this._siteService.currentSite.subscribe(site => {
      const checkpoints: any[] = [];
      this.resourceId = site.id;

      checkpoints.push({
        category: 'availability',
        detector: 'requestsanderrors',
        title: 'Requests and Errors',
        href: 'analysis/appDownAnalysis',
        healthStatus: HealthStatus.None,
        healthStatusMessage: undefined,
        loadingStatus: LoadingStatus.Loading
      });

      checkpoints.push({
        category: 'availability',
        detector: 'appperformance',
        title: 'App Performance',
        href: 'analysis/perfAnalysis',
        healthStatus: HealthStatus.None,
        healthStatusMessage: undefined,
        loadingStatus: LoadingStatus.Loading
      });

      if (SiteExtensions.operatingSystem(site) === OperatingSystem.windows) {
        checkpoints.push({
          category: 'availability',
          detector: 'instancecpu',
          title: 'CPU Usage',
          href: 'analysis/webappcpu',
          healthStatus: HealthStatus.None,
          healthStatusMessage: undefined,
          loadingStatus: LoadingStatus.Loading
        });

        checkpoints.push({
          category: 'availability',
          detector: 'privatebytes',
          title: 'Memory Usage',
          href: 'analysis/Memoryusage',
          healthStatus: HealthStatus.None,
          healthStatusMessage: undefined,
          loadingStatus: LoadingStatus.Loading
        });
      }
      this.healthCheckpoints = checkpoints;
      this.healthCheckpointsSubject.next(checkpoints);
    });
  }

  ngOnInit(): void {

    this.subscriptionId = this._route.snapshot.params['subscriptionid'];
    this.resourceGroup = this._route.snapshot.params['resourcegroup'];
    this.siteName = this._route.snapshot.params['resourcename'];
    this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

    this._loadData();
  }

  ngAfterViewInit(): void {
    this.onViewUpdate.emit();
  }

  updateDetectorStatus(index: number, res: DetectorResponse) {
    if (res != null) {
      this.healthCheckpoints[index].loadingStatus = LoadingStatus.Success;
      this.healthCheckpoints[index].healthStatus = this.getDetectorStatus(res);
    } else {
      this.healthCheckpoints[index].loadingStatus = LoadingStatus.Failed;
    }
  }

  getDetectorStatus(response: DetectorResponse): HealthStatus {
    let status = HealthStatus.Success;
    let allInsights: Insight[] = InsightUtils.parseAllInsightsFromResponse(response);
    if (allInsights.length > 0) {
      status = allInsights[0].status
    }
    return status;
  }

  setCategory(index: number) {
    this.selectedCategoryIndex = index;
  }

  logFullReportClick(title: string) {
    this._logger.LogClickEvent('Full Report', `${title} : Health Check Report Category`, 'Support Home');
  }

  private _loadData() {
    if (this.healthCheckpoints) {
      this.healthCheckpoints.forEach(item => {
        this._diagnosticService.getDetector(item.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
          this.detectorControlService.shouldRefresh, this.detectorControlService.isInternalView)
          .subscribe((response: DetectorResponse) => {
            item.loadingStatus = LoadingStatus.Success;
            item.healthStatus = this.getDetectorStatus(response);
          }, (error: any) => {
            item.loadingStatus = LoadingStatus.Failed;
          });
      });
      this.onComplete.emit({ status: true });
    }
  }
  onFullReportClick(href: string, title: string) {
    const slot = this.slotName && this.slotName != '' ? `/slots/${this.slotName}` : '';
    this._router.navigateByUrl(`resource/subscriptions/${this.subscriptionId}/resourcegroups/${this.resourceGroup}/providers/microsoft.web/sites/${this.siteName}${slot}/${href}`);
    this.logFullReportClick(title);
  }

}
