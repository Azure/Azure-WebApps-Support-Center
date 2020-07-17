import { Component, OnInit } from '@angular/core';
import { DiagnosticService, RenderingType, DataTableResponseObject, DetectorControlService, Insight } from 'diagnostic-data';
import { DaasService } from '../../../../services/daas.service';
import { SiteService } from '../../../../services/site.service';


@Component({
  selector: 'crash-monitoring-analysis',
  templateUrl: './crash-monitoring-analysis.component.html',
  styleUrls: ['./crash-monitoring-analysis.component.scss']
})
export class CrashMonitoringAnalysisComponent implements OnInit {

  constructor(private _diagnosticService: DiagnosticService, private detectorControlService: DetectorControlService,
    private _daasService: DaasService, private _siteService: SiteService) { }
  crashMonitoringAnalysisStatus = crashMonitoringAnalysisStatus;
  status: crashMonitoringAnalysisStatus = crashMonitoringAnalysisStatus.Loading;
  crashMonitoringDatas: CrashMonitoringData[] = [];
  blobSasUri: string = "";
  insights: CrashInsight[];

  ngOnInit() {
    this.init();
  }

  init() {
    this.status = crashMonitoringAnalysisStatus.Loading
    this.crashMonitoringDatas = [];
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this._daasService.getBlobSasUri(site).subscribe(resp => {
        this.blobSasUri = resp.BlobSasUri;
        if (resp.BlobSasUri) {
          this._diagnosticService.getDetector("crashmonitoring", this.detectorControlService.startTimeString, this.detectorControlService.endTimeString, true, false, null, null).subscribe(detectorResponse => {
            let rawTable = detectorResponse.dataset.find(x => x.renderingProperties.type === RenderingType.Table) // && x.table.tableName === "CrashMonitoring");
            this.status = crashMonitoringAnalysisStatus.Loaded;
            if (rawTable != null && rawTable.table != null && rawTable.table.rows != null && rawTable.table.rows.length > 0) {
              let dataTable: DataTableResponseObject = rawTable.table;

              let cIdxTimeStamp: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.timeStamp);
              let cIdxExitCode: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.exitCode);
              let cIdxCallStack: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.callStack);
              let cIdxManagedException: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.managedException);
              let cIdxDumpFileName: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.dumpFileName);

              dataTable.rows.forEach(row => {
                let crashMonitoringData = new CrashMonitoringData();
                crashMonitoringData.timeStamp = row[cIdxTimeStamp];
                crashMonitoringData.exitCode = row[cIdxExitCode];
                crashMonitoringData.callStack = row[cIdxCallStack];
                crashMonitoringData.managedException = row[cIdxManagedException];
                crashMonitoringData.dumpFileName = row[cIdxDumpFileName];
                crashMonitoringData.dumpHref = this.getLinkToDumpFile(crashMonitoringData.dumpFileName);
                this.crashMonitoringDatas.push(crashMonitoringData);
              });

              this.insights = [];
              let unique = Array.from(new Set(this.crashMonitoringDatas.map(item => item.exitCode)));
              unique.forEach(exitCode => {
                let insight = new CrashInsight();
                insight.data = this.crashMonitoringDatas.filter(x => x.exitCode == exitCode);
                insight.title = insight.data.length + " crashes due to exit code 0x" + exitCode;
                this.insights.push(insight);
              })
            }
          });
        }
      });
    });



  }

  toggleInsightStatus(insight: CrashInsight) {
    insight.isExpanded = !insight.isExpanded;
  }

  getLinkToDumpFile(dumpFileName: string): string {
    let blobUrl = new URL(this.blobSasUri);
    let relativePath = "CrashDumps/" + dumpFileName;
    return `https://${blobUrl.host}${blobUrl.pathname}/${relativePath}?${blobUrl.searchParams}`;
  }

  viewCallStack(insight:CrashInsight, data:CrashMonitoringData){
    insight.selectedCallStack = data.callStack;
    insight.selectedManagedException = data.managedException;
  }

}



export enum crashMonitoringAnalysisStatus {
  Loading,
  Loaded
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