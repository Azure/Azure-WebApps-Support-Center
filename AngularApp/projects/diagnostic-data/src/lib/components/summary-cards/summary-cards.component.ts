import { Component, OnInit, Inject } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { HealthStatus, DiagnosticData, DetectorMetaData, DetectorType } from '../../models/detector';
import { FeatureNavigationService } from '../../services/feature-navigation.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { DiagnosticService } from '../../services/diagnostic.service';


export class SummaryCard {
  title: string;
  message: string;
  description: string;
  status: HealthStatus;
  link: string;
  actionType: ActionType;
  isDetector: boolean;
  isClickable: boolean;

  constructor(title:string,message:string,description:string,status:HealthStatus,link:string,actionType:ActionType) {
    this.title = title;
    this.message = message;
    this.description = description;
    this.status = status;
    this.link = link;
    this.actionType = actionType;
    this.isClickable = this.checkClickable(actionType,link);
  }
  private checkClickable(actionType:ActionType,link:string):boolean {
    if (actionType !== ActionType.None && link !== "") {
      return true;
    }
    return false;
  }
}

export enum ActionType {
  Detector,
  Tool,
  None
}

@Component({
  selector: 'summary-cards',
  templateUrl: './summary-cards.component.html',
  styleUrls: ['./summary-cards.component.scss']
})
export class SummaryCardsComponent extends DataRenderBaseComponent {
  summaryCards: SummaryCard[] = [];
  isDetector: boolean[] = [];
  detectors: DetectorMetaData[];
  SummaryStatus = HealthStatus;
  isPublic: boolean;
  constructor(protected _telemetryService: TelemetryService, private _activatedRoute: ActivatedRoute, private _router: Router, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private _navigator: FeatureNavigationService,private _diagnosticService: DiagnosticService) {
    super(_telemetryService);
    this.isPublic = config && config.isPublic;
    this._diagnosticService.getDetectors().subscribe(detectors => {
      this.detectors = detectors;
    })
    // this._authService.getStartupInfo().subscribe(startupInfo => this.resourceId = startupInfo.resourceId);
    // console.log("summary card",this._featureService);
  }
  // ngOnInit() {
  //   this.ngOnInit();
  // }

  protected processData(data: DiagnosticData) {
    super.processData(data);

    const statusColumn = 0;
    const titleColumn = 1;
    const messageColumn = 2;
    const descriptionColumn = 3;
    const linkColumn = 4;
    const actionTypeColumn = 5

    const rows = data.table.rows;
    rows.forEach(row => {
      let status: string = row[statusColumn];
      let actionType: string = row[actionTypeColumn];
      let card = new SummaryCard(
        row[titleColumn],
        row[messageColumn],
        row[descriptionColumn],
        HealthStatus[status],
        row[linkColumn],
        ActionType[actionType]
      )
      card.isDetector = this.checkIsDetector(row[linkColumn]);
      this.summaryCards.push(card);
    });

  }


  

  //Todo: Add Tool type Navigation
  onClickCard(card: SummaryCard): void {
    switch (card.actionType) {
      case ActionType.Detector:
        this.navigate(card);
        break;
      case ActionType.None:
        break;
      default:
        break;
    }
  }

  //Still have issue on navigate
  navigate(card: SummaryCard): void {
    //for now only navigate to detectors which are under same category
    if (this.isPublic) {
      // const category = this._featureService.getCategoryIdByhDetectorId(card.link);
      if (card.isDetector) {
        this._router.navigate([`../detectors/${card.link}`],{relativeTo: this._activatedRoute,queryParamsHandling:'merge'});
      } else {
        this._router.navigate([`../analysis/${card.link}`],{relativeTo: this._activatedRoute,queryParamsHandling:'merge'});
      }
    } else {
      this._navigator.NavigateToDetector(this._activatedRoute.snapshot.params['detector'], card.link);
    }
  }

  private checkIsDetector(detectorId:string):boolean {
    const detector = this.detectors.find(detector => detectorId === detector.id);
    return detector && detector.type === DetectorType.Detector;
  }
}
