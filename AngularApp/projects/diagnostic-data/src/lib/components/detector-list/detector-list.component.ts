import { forkJoin as observableForkJoin, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { catchError } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Pipe, PipeTransform, Inject } from '@angular/core';
import {
  DetectorListRendering, DetectorMetaData, DetectorResponse, DiagnosticData, HealthStatus
} from '../../models/detector';
import { LoadingStatus } from '../../models/loading';
import { StatusStyles } from '../../models/styles';
import { DetectorControlService } from '../../services/detector-control.service';
import { DiagnosticService } from '../../services/diagnostic.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ParseResourceService } from '../../services/parse-resource.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';


@Component({
  selector: 'detector-list',
  templateUrl: './detector-list.component.html',
  styleUrls: ['./detector-list.component.scss'],
  animations: [
    trigger('expand', [
      state('shown', style({ height: '*' })),
      state('hidden', style({ height: '0px', visibility: 'hidden' })),
      transition('* => *', animate('.25s'))
    ])
  ]
})
export class DetectorListComponent extends DataRenderBaseComponent {

  LoadingStatus = LoadingStatus;
  renderingProperties: DetectorListRendering;
  detectorMetaData: DetectorMetaData[];
  detectorViewModels: any[] = [];
  DetectorStatus = HealthStatus;
  errorDetectors: any[] = [];
  private childDetectorsEventProperties = {};
  overrideResourceUri: string = "";
  resourceType: string = "";
  errorMsg: string = "";
  internalErrorMsg: string = "";
  isPublic: boolean;
  imgSrc: string = "";
  constructor(private _diagnosticService: DiagnosticService, protected telemetryService: TelemetryService, private _detectorControl: DetectorControlService, private parseResourceService: ParseResourceService, @Inject(DIAGNOSTIC_DATA_CONFIG) private config: DiagnosticDataConfig) {
    super(telemetryService);
    this.isPublic = this.config && this.config.isPublic;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <DetectorListRendering>data.renderingProperties;
    this.checkShouldGetDetectors();
  }

  private checkShouldGetDetectors() {
    let isFromDependentResource = this.checkIsFromDependentResource();
    if (isFromDependentResource) {
      this.parseResourceService.checkIsResourceSupport(this.overrideResourceUri, false).subscribe(error => {
        this.internalErrorMsg = error;
        if (error === "") {
          this.resourceType = this.parseResourceService.resourceType;
          this.imgSrc = this.parseResourceService.resource.imgSrc;
          this.telemetryService.logEvent("DependentChildDetector", {
            resourceUri: this.overrideResourceUri
          });
          this.getDetectorResponses();
        }
      });
    } else {
      //From parent resource
      this.getDetectorResponses();
    }
  }

  private getDetectorResponses() {
    this._diagnosticService.getDetectors(this.overrideResourceUri).subscribe(detectors => {
      this.detectorMetaData = detectors.filter(detector => this.renderingProperties.detectorIds.indexOf(detector.id) >= 0);
      this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector, this.renderingProperties.additionalParams, this.overrideResourceUri));

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
    },
      (err => {
        if (this.overrideResourceUri !== "") {
          const e = JSON.parse(err);
          let code: string = "";
          if (e && e.error && e.error.code) {
            code = e.error.code;
          }
          switch (code) {
            case "InvalidAuthenticationTokenTenant":
              this.errorMsg = `No Access for resource ${this.resourceType} , please check your access`;
              break;

            case "":
              break;

            default:
              this.errorMsg = code;
              break;
          }
        }
      })
    );
  }

  public retryRequest(metaData: any) {
    metaData.loadingStatus = LoadingStatus.Loading;
    metaData.request.subscribe(
      (response: DetectorResponse) => {
        metaData = this.updateDetectorViewModelSuccess(metaData, response);
      },
      (error) => {
        metaData.loadingStatus = LoadingStatus.Failed;
      });
  }

  private getDetectorViewModel(detector: DetectorMetaData, additionalParams?: string, overwriteResourceUrl?: string) {
    let queryString = null;
    if (additionalParams) {
      let contextToPass = <Object>JSON.parse(additionalParams);
      queryString = '';
      for (var key in contextToPass) {
        if (contextToPass.hasOwnProperty(key)) {
          queryString += `&${key}=${encodeURIComponent(contextToPass[key])}`;
        }
      }
    }
    return {
      title: detector.name,
      metadata: detector,
      loadingStatus: LoadingStatus.Loading,
      status: null,
      statusColor: null,
      statusIcon: null,
      expanded: false,
      response: null,
      request: this._diagnosticService.getDetector(detector.id, this._detectorControl.startTimeString, this._detectorControl.endTimeString, this._detectorControl.shouldRefresh, this._detectorControl.isInternalView, queryString, overwriteResourceUrl)
    };
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

  toggleDetectorHeaderStatus(viewModel: any) {
    viewModel.expanded = viewModel.loadingStatus === LoadingStatus.Success && !viewModel.expanded;
    const clickDetectorEventProperties = {
      'ChildDetectorName': viewModel.title,
      'ChildDetectorId': viewModel.metadata.id,
      'IsExpanded': viewModel.expanded,
      'Status': viewModel.status
    };

    // Log children detectors click
    this.logEvent(TelemetryEventNames.ChildDetectorClicked, clickDetectorEventProperties);
  }

  checkIsFromDependentResource(): boolean {
    if (!this.renderingProperties.resourceUri || this.renderingProperties.resourceUri === "") return false;
    this.overrideResourceUri = this.renderingProperties.resourceUri;

    return true;
  }
}

@Pipe({
  name: 'detectorOrder',
  pure: false
})
export class DetectorOrderPipe implements PipeTransform {
  transform(items: any[]) {
    return items.sort((a, b) => {
      return a.status > b.status ? 1 : -1;
    });
  }
}
