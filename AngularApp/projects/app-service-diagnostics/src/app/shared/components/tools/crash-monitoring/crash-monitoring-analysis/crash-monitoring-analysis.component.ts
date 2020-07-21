import { Component, OnInit, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { DiagnosticService, RenderingType, DataTableResponseObject, DetectorControlService, Insight } from 'diagnostic-data';
import { DaasService } from '../../../../services/daas.service';
import { SiteService } from '../../../../services/site.service';
import * as momentNs from 'moment';
import { CrashMonitoringSettings } from '../../../../models/daas';
import moment = require('moment');
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'crash-monitoring-analysis',
  templateUrl: './crash-monitoring-analysis.component.html',
  styleUrls: ['./crash-monitoring-analysis.component.scss']
})
export class CrashMonitoringAnalysisComponent implements OnInit, OnChanges, OnDestroy {

  @Input() crashMonitoringSettings: CrashMonitoringSettings
  loading: boolean = true;
  crashMonitoringDatas: CrashMonitoringData[] = [];
  blobSasUri: string = "";
  insights: CrashInsight[];
  monitoringEnabled: boolean = false;
  error: any;
  errorMessage: string;
  loadingMessage: string;
  subscription: Subscription;

  constructor(private _diagnosticService: DiagnosticService, private detectorControlService: DetectorControlService,
    private _daasService: DaasService, private _siteService: SiteService) { }

  ngOnInit() {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this._daasService.getBlobSasUri(site).subscribe(resp => {
        if (resp.BlobSasUri) {
          this.blobSasUri = resp.BlobSasUri;
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.init()
  }

  initGlobals() {
    this.loading = true;
    this.error = null;
    this.errorMessage = "";
    this.crashMonitoringDatas = [];
    this.insights = [];
    this.monitoringEnabled = false;
    this.loadingMessage = "";
  }

  refreshData() {
    this._diagnosticService.getDetector("crashmonitoring", this.detectorControlService.startTimeString, this.detectorControlService.endTimeString, true, false, null, null).subscribe(detectorResponse => {
      let rawTable = detectorResponse.dataset.find(x => x.renderingProperties.type === RenderingType.Table) // && x.table.tableName === "CrashMonitoring");
      if (rawTable != null && rawTable.table != null && rawTable.table.rows != null && rawTable.table.rows.length > 0) {
        let dataTable: DataTableResponseObject = rawTable.table;
        this.populateInsights(dataTable);
      }
    });

  }

  init() {
    this.initGlobals()
    this.loadingMessage = "Getting site information";
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.loading = false;
      if (this.crashMonitoringSettings != null) {
        let monitoringDates = this._siteService.getCrashMonitoringDates(this.crashMonitoringSettings);
        if (momentNs.utc() > momentNs.utc(monitoringDates.start) && momentNs.utc() < momentNs.utc(monitoringDates.end)) {
          this.monitoringEnabled = true;
          this.subscription = interval(60 * 1000).subscribe(res => {
            this.refreshData();
          });
        }
      }
    });
  }

  populateInsights(dataTable: DataTableResponseObject) {
    let cIdxTimeStamp: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.timeStamp);
    let cIdxExitCode: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.exitCode);
    let cIdxCallStack: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.callStack);
    let cIdxManagedException: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.managedException);
    let cIdxDumpFileName: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.dumpFileName);

    if (this.crashMonitoringSettings != null) {
      let monitoringDates = this._siteService.getCrashMonitoringDates(this.crashMonitoringSettings);
      dataTable.rows.forEach(row => {
        let rowDate: Date = moment.utc(row[cIdxTimeStamp]).toDate();
        if (this.crashMonitoringSettings != null &&
          rowDate > monitoringDates.start && rowDate < monitoringDates.end) {
          let crashMonitoringData = new CrashMonitoringData();
          crashMonitoringData.timeStamp = row[cIdxTimeStamp];
          crashMonitoringData.exitCode = row[cIdxExitCode];
          crashMonitoringData.callStack = row[cIdxCallStack];
          crashMonitoringData.managedException = row[cIdxManagedException];
          crashMonitoringData.dumpFileName = row[cIdxDumpFileName];
          crashMonitoringData.dumpHref = this.getLinkToDumpFile(crashMonitoringData.dumpFileName);
          this.crashMonitoringDatas.push(crashMonitoringData);
        }
      });
    }

    this.insights = [];
    let unique = Array.from(new Set(this.crashMonitoringDatas.map(item => item.exitCode)));
    unique.forEach(exitCode => {
      let insight = new CrashInsight();
      insight.data = this.crashMonitoringDatas.filter(x => x.exitCode == exitCode);

      if (insight.data.length > 1) {
        insight.title = insight.data.length + " crashes";
      } else {
        insight.title = "One crash"
      }
      insight.title += " due to exit code 0x" + exitCode;

      // sort the array based on timestamp
      insight.data = insight.data.sort((a, b) => a.timeStamp > b.timeStamp ? -1 : a.timeStamp < b.timeStamp ? 1 : 0);
      this.insights.push(insight);
    });
  }

  getDisplayDate(date: Date): string {
    return momentNs(date).format('YYYY-MM-DD hh:mm') + ' UTC';
  }

  toggleInsightStatus(insight: CrashInsight) {
    insight.isExpanded = !insight.isExpanded;
  }

  getLinkToDumpFile(dumpFileName: string): string {
    let blobUrl = new URL(this.blobSasUri);
    let relativePath = "CrashDumps/" + dumpFileName;
    return `https://${blobUrl.host}${blobUrl.pathname}/${relativePath}?${blobUrl.searchParams}`;
  }

  viewCallStack(insight: CrashInsight, data: CrashMonitoringData) {
    insight.selectedCallStack = data.callStack;
    insight.selectedManagedException = data.managedException;
  }

  getErrorDetails(): string {
    return JSON.stringify(this.error);
  }

}

enum tblIndex {
  timeStamp = "TIMESTAMP",
  exitCode = "ExitCode",
  callStack = "StackTrace",
  managedException = "ManagedException",
  dumpFileName = "DumpFile",
}

export class CrashMonitoringData {
  timeStamp: Date;
  exitCode: string;
  callStack: string;
  managedException: string = "";
  dumpFileName: string;
  dumpHref: string
}

export class CrashInsight {
  isExpanded: boolean = false;
  title: string;
  data: CrashMonitoringData[];
  selectedManagedException: string = "";
  selectedCallStack: string = "";

}