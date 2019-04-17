import { Component, OnInit, OnChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { DetectorControlService, DetectorMetaData, LoadingStatus, DetectorResponse, TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { forkJoin as observableForkJoin, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { StatusStyles } from 'projects/diagnostic-data/src/lib/models/styles';
import { catchError } from 'rxjs/operators';
import { DataRenderBaseComponent } from 'projects/diagnostic-data/src/lib/components/data-render-base/data-render-base.component';
@Component({
  selector: 'tab-analysis',
  templateUrl: './tab-analysis.component.html',
  styleUrls: ['./tab-analysis.component.scss']
})
export class TabAnalysisComponent extends DataRenderBaseComponent implements OnInit, OnChanges {

  analysisId: string;
  detectorId: string;
  detectorName: string;
  contentHeight: string;
  detectors: any[] = [];
  LoadingStatus = LoadingStatus;
  detectorViewModels: any[];
  detectorMetaData: DetectorMetaData[];
  private childDetectorsEventProperties = {};

  constructor(private _route: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService,
    private _detectorControl: DetectorControlService, protected telemetryService: TelemetryService) {
    super(telemetryService);
    this.contentHeight = (window.innerHeight - 112) + 'px';
  }

  ngOnInit() {
    this._route.paramMap.subscribe(params => {
      this.analysisId = params.get('analysis');
      this.detectorId = params.get('detector') === null ? "" : params.get('detector');

      this.detectors = [];
      this._diagnosticService.getDetectors().subscribe(detectorList => {
        if (detectorList) {

          if (this.detectorId !== "") {
            let currentDetector = detectorList.find(detector => detector.id == this.detectorId)
            this.detectorName = currentDetector.name;
          }

          detectorList.forEach(element => {
            if (element.analysisTypes.length > 0) {
              element.analysisTypes.forEach(analysis => {
                if (analysis === this.analysisId) {
                  // let link: any[] = [];

                  // if (this.detectorId !== "") {
                  //   link = ['../' + element.id];
                  // } else {
                  //   link = ['./' + element.id];
                  // }
                  this.detectors.push({ name: element.name, id: element.id });

                }
              });
            }
          });

          this.detectorMetaData = detectorList.filter(detector => this.detectors.findIndex(d => d.id === detector.id) >= 0);
          this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector));

          const requests: Observable<any>[] = [];
          this.detectorViewModels.forEach((metaData, index) => {
            requests.push((<Observable<DetectorResponse>>metaData.request).pipe(
              map((response: DetectorResponse) => {
                this.detectorViewModels[index] = this.updateDetectorViewModelSuccess(metaData, response);
                return {
                  'ChildDetectorName': this.detectorViewModels[index].title,
                  'ChildDetectorId': this.detectorViewModels[index].metadata.id,
                  'ChildDetectorStatus': this.detectorViewModels[index].status,
                  'ChildDetectorLoadingStatus': this.detectorViewModels[index].loadingStatus
                };
              })
              , catchError(err => {
                this.detectorViewModels[index].loadingStatus = LoadingStatus.Failed;
                return throwError(err);
              })
            ));
          });

          // Log all the children detectors
          observableForkJoin(requests).subscribe(childDetectorData => {
            this.childDetectorsEventProperties['ChildDetectorsList'] = JSON.stringify(childDetectorData);
            this.logEvent(TelemetryEventNames.ChildDetectorsSummary, this.childDetectorsEventProperties);
          });

        }
      });
    });

  }

  ngOnChanges() {

  }

  getRouterLink(detectorId: string): any[] {
    let link = [];
    if (this.detectorId !== "") {
      link = ['../' + detectorId];
    } else {
      link = ['./' + detectorId];
    }
    return link;
  }

  private updateDetectorViewModelSuccess(viewModel: any, res: DetectorResponse) {
    const status = res.status.statusId;

    viewModel.loadingStatus = LoadingStatus.Success,
      viewModel.status = status;
    viewModel.statusColor = StatusStyles.getColorByStatus(status),
      viewModel.statusIcon = StatusStyles.getIconByStatus(status),
      viewModel.response = res;
    return viewModel;
  }

  private getDetectorViewModel(detector: DetectorMetaData) {
    return {
      title: detector.name,
      metadata: detector,
      loadingStatus: LoadingStatus.Loading,
      status: null,
      statusColor: null,
      statusIcon: null,
      expanded: false,
      response: null,
      request: this._diagnosticService.getDetector(detector.id, this._detectorControl.startTimeString, this._detectorControl.endTimeString)
    };
  }
}
