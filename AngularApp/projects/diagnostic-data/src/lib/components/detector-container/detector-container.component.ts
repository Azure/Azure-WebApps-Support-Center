import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { DetectorResponse, RenderingType, DownTime } from '../../models/detector';
import { BehaviorSubject } from 'rxjs';
import { VersionService } from '../../services/version.service';
import { Moment } from 'moment';
import * as momentNs from 'moment';
import { XAxisSelection } from '../../models/time-series';
const moment = momentNs;

@Component({
  selector: 'detector-container',
  templateUrl: './detector-container.component.html',
  styleUrls: ['./detector-container.component.scss']
})
export class DetectorContainerComponent implements OnInit {

  detectorResponse: DetectorResponse = null;
  error: any;

  startTimeToUse:Moment;
  endTimeToUse:Moment;
  startTimeChildDetector : Moment = null;
  endTimeChildDetector : Moment = null;

  @Input() hideDetectorControl: boolean = false;
  hideTimerPicker: boolean = false;

  detectorName: string;
  detectorRefreshSubscription: any;
  refreshInstanceIdSubscription: any;

  @Input() detectorSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  @Input() set detector(detector: string) {
    this.detectorSubject.next(detector);
  }

  @Input() analysisMode: boolean = false;
  @Input() isAnalysisView: boolean = false;
  
  @Output() XAxisSelection:EventEmitter<XAxisSelection> = new EventEmitter<XAxisSelection>();	
  public onXAxisSelection(event:XAxisSelection) {
		this.XAxisSelection.emit(event);
  }
  @Output() downTimeChanged: EventEmitter<DownTime> = new EventEmitter<DownTime>();
  
  isCategoryOverview: boolean = false;
  private isLegacy: boolean
  constructor(private _route: ActivatedRoute, private _diagnosticService: DiagnosticService,
    public detectorControlService: DetectorControlService, private versionService: VersionService) {
  }

  get isPopoutFromAnalysis():boolean {
    if(!!this._route.parent) {
      return !!this._route.parent.snapshot.url.find(urlPart=>urlPart.path === 'popout');
    }
    else {
      return false;
    }
    
  }

  ngOnInit() {
    this.versionService.isLegacySub.subscribe(isLegacy => this.isLegacy = isLegacy);
    //Remove after A/B Test
    if (this.isLegacy) {
      this.hideTimerPicker = false;
    } else {
      this.hideTimerPicker = this.hideDetectorControl || this._route.snapshot.parent.url.findIndex((x: UrlSegment) => x.path === "categories") > -1;
    }

    this.detectorRefreshSubscription = this.detectorControlService.update.subscribe(isValidUpdate => {
      if (isValidUpdate && this.detectorName) {
        this.refreshInstanceIdSubscription = this.detectorControlService._refreshInstanceId.subscribe((instanceId) => {
          if (instanceId.toLowerCase() === this.detectorName.toLowerCase() || instanceId === "V3ControlRefresh") {
            this.refresh(true);
          }
        });
      }
    });

    this.detectorSubject.subscribe(detector => {
      if (detector && detector !== "searchResultsAnalysis") {
        this.detectorName = detector;
        this.refresh(false);
      }
    });

    const component: any = this._route.component;
    if (component && component.name) {
      this.isCategoryOverview = component.name === "CategoryOverviewComponent";
    }

    let startTimeChildDetector: string = this._route.snapshot.queryParams['startTimeChildDetector'];
    if (startTimeChildDetector != null) {
      this.startTimeChildDetector =  moment.utc(startTimeChildDetector) ;
    }

    let endTimeChildDetector: string = this._route.snapshot.queryParams['endTimeChildDetector'];
    if (endTimeChildDetector != null) {
      this.endTimeChildDetector =  moment.utc(endTimeChildDetector) ;
    }

  }

  refresh(hardRefresh: boolean) {
    this.error = null;
    this.detectorResponse = null;
    this.getDetectorResponse(hardRefresh);
  }

  public get getStartTime():Moment {        
    let startTime:Moment = this.detectorControlService.startTime;
    if(!this.isAnalysisDetector()){
      let startTimeChildDetector: string = this._route.snapshot.queryParams['startTimeChildDetector'];

      if (startTimeChildDetector != null) {
        startTime =  moment.utc(startTimeChildDetector) ;
        this.startTimeChildDetector = startTime;
      }
      else {
        if(this.startTimeChildDetector != null) {
          startTime = this.startTimeChildDetector;
        }
      }
    }
    return startTime;
  }

  public get getEndTime():Moment {    
    let endTime:Moment = this.detectorControlService.endTime;
    if(!this.isAnalysisDetector()){
      let endTimeChildDetector: string = this._route.snapshot.queryParams['endTimeChildDetector'];

      if (endTimeChildDetector != null) {
        endTime =  moment.utc(endTimeChildDetector) ;
        this.endTimeChildDetector = endTime;
      }
      else {
        if(this.endTimeChildDetector != null) {
          endTime = this.endTimeChildDetector;
        }
      }
    }
    return endTime;
  }

  isAnalysisDetector():boolean {
    let analysisId = '';
    if(this.analysisMode) {
      analysisId = this._route.parent.snapshot.paramMap.get("analysisId");
    }
    else {
      analysisId = this._route.snapshot.paramMap.get('analysisId');  
    }
    
    return !(this.analysisMode && analysisId != this.detectorName);
  }

  getDetectorResponse(hardRefresh: boolean) {
    let startTime = this.detectorControlService.startTimeString;
    let endTime = this.detectorControlService.endTimeString;
    let invalidateCache = hardRefresh ? hardRefresh : this.detectorControlService.shouldRefresh;
    let allRouteQueryParams = this._route.snapshot.queryParams;
    let additionalQueryString = '';
    let knownQueryParams = ['startTime', 'endTime'];
    let queryParamsToSkipForAnalysis = ['startTimeChildDetector', 'endTimeChildDetector'];
    Object.keys(allRouteQueryParams).forEach(key => {
      if(knownQueryParams.indexOf(key) < 0) {
        if(this.isAnalysisDetector()) {
          if(queryParamsToSkipForAnalysis.indexOf(key)<0) {
            additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
          }
        }
        else {
          additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
        }        
      }
    });
	
	if (this.analysisMode) {
    var startTimeChildDetector: string = allRouteQueryParams['startTimeChildDetector'];
    var endTimeChildDetector: string = allRouteQueryParams['endTimeChildDetector'];
		if (startTimeChildDetector != null) {
      startTime = startTimeChildDetector ;
    }
    
    if (endTimeChildDetector != null) {
      endTime = endTimeChildDetector;
    }
	}
  
  
  
	this._diagnosticService.getDetector(this.detectorName, startTime, endTime,
    invalidateCache, this.detectorControlService.isInternalView, additionalQueryString)
      .subscribe((response: DetectorResponse) => {
        this.shouldHideTimePicker(response);
        this.detectorResponse = response;
      }, (error: any) => {
        this.error = error;
      });
}

  // TODO: Right now this is hardcoded to hide for cards, but make this configurable from backend
  shouldHideTimePicker(response: DetectorResponse) {
    if (response && response.dataset && response.dataset.length > 0) {
      const cardRenderingIndex = response.dataset.findIndex(data => data.renderingProperties.type == RenderingType.Cards);

      //Remove after A/B Test
      if (this.isLegacy) {
        this.hideDetectorControl = cardRenderingIndex >= 0;
      } else {
        this.hideDetectorControl = cardRenderingIndex >= 0 || this.hideDetectorControl;
      }

    }
  }

  ngOnDestroy(): void {
    if (this.detectorRefreshSubscription) {
      this.detectorRefreshSubscription.unsubscribe();
    }
    if (this.refreshInstanceIdSubscription) {
      this.refreshInstanceIdSubscription.unsubscribe();
    }
  }

  onDowntimeChanged(event: DownTime) {
    this.downTimeChanged.emit(event);
  }
}
