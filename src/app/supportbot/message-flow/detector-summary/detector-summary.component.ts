import { Component, OnInit, Injector, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { DiagnosticService } from 'applens-diagnostics';
import { Message } from '../../models/message';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { Observable } from 'rxjs';
import { NavigationExtras, Router, ActivatedRoute } from '@angular/router';
import { LoadingStatus, DetectorResponse, Rendering, DetectorListRendering, DiagnosticData, HealthStatus } from 'applens-diagnostics';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';

@Component({
  selector: 'detector-summary',
  templateUrl: './detector-summary.component.html',
  styleUrls: ['./detector-summary.component.css']
})
export class DetectorSummaryComponent implements OnInit, AfterViewInit, IChatMessageComponent {

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

  detectorSummaryViewModels: DetectorSummaryViewModel[] = [];

  constructor(private _injector: Injector, private _diagnosticService: DiagnosticService, private _router: Router, private _activatedRoute: ActivatedRoute,
    private _chatState: CategoryChatStateService) { }

  ngOnInit() {
    this._diagnosticService.getDetector(this._chatState.selectedFeature.id).subscribe(response => {
      console.log(response);
      this.processDetectorResponse(response).subscribe(() => {
        this.onComplete.emit({status: true});
      });
    })
  }

  ngAfterViewInit() {
    this.onViewUpdate.emit();
  }

  processDetectorResponse(detectorResponse: DetectorResponse): Observable<void[]> {
    let detectorList = detectorResponse.dataset.find(set => (<Rendering>set.renderingProperties).type === 10);

    if(detectorList) {
      return this._diagnosticService.getDetectors().flatMap(detectors => {
        let subDetectors = (<DetectorListRendering>detectorList.renderingProperties).detectorIds;

        this.detectorSummaryViewModels = detectors.filter(detector => subDetectors.indexOf(detector.id) != -1).map(detector => {
          return <DetectorSummaryViewModel>{
            id: detector.id,
            loading: LoadingStatus.Loading,
            name: detector.name,
            path: `detectors/${detector.id}`,
            status: null
          };
        });

        return Observable.forkJoin(this.detectorSummaryViewModels.map(detector => {
          return this._diagnosticService.getDetector(detector.id).map(response => {
            detector.status = response.status.statusId;
            detector.loading = LoadingStatus.Success;
          });
        }))
        
      })
      
    }
    else {
      let insightResponses = detectorResponse.dataset.filter(set => (<Rendering>set.renderingProperties).type === 7);
      insightResponses.forEach(diagnosticData => {
        let insights = this.parseInsights(diagnosticData, detectorResponse.metadata.id);
        insights.forEach(insight => {
          this.detectorSummaryViewModels.push(insight);
        });
      });
      return Observable.of(null);
    }
  }

  navigateTo(path: string) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute.parent
    };

    this._router.navigate(path.split('/'), navigationExtras);
  }

  private parseInsights(diagnosticData: DiagnosticData, detectorId: string): DetectorSummaryViewModel[] {
    let insights: DetectorSummaryViewModel[] = [];
    let data = diagnosticData.table;

    let statusColumnIndex = 0;
    let insightColumnIndex = 1;

    for (let i: number = 0; i < data.rows.length; i++) {
      let row = data.rows[i];
      let insight: DetectorSummaryViewModel;
      let insightName = row[insightColumnIndex];
      if ((insight = insights.find(insight => insight.name === insightName)) == null) {
        insights.push(<DetectorSummaryViewModel>{
          id: insightName,
          loading: LoadingStatus.Success,
          name: insightName,
          path: `detectors/${detectorId}`,
          status: HealthStatus[row[statusColumnIndex]]
        });
      }
    }

    return insights;
  }
}

export class DetectorSummaryMessage extends Message {
  constructor(messageDelayInMs: number = 1000) {

    super(DetectorSummaryComponent, {}, messageDelayInMs);
  }
}

interface DetectorSummaryViewModel {
  id: string;
  name: string;
  path: string;
  loading: LoadingStatus;
  status: any;
}