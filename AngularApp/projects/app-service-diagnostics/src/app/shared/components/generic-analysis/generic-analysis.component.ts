import { Component, OnInit, Inject } from '@angular/core';
import { GenericDetectorComponent } from '../generic-detector/generic-detector.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { FeatureNavigationService, TelemetryService, DiagnosticService, DiagnosticDataConfig, DIAGNOSTIC_DATA_CONFIG } from 'diagnostic-data';
import { AuthService } from '../../../startup/services/auth.service';
//import { CXPChatService } from 'diagnostic-data' ;//'../../services/cxp-chat.service';
import {GenericSupportTopicService} from '../../../../../../diagnostic-data/src/lib/services/generic-support-topic.service';

@Component({
  selector: 'generic-analysis',
  templateUrl: './generic-analysis.component.html',
  styleUrls: ['./generic-analysis.component.scss']
})
export class GenericAnalysisComponent extends GenericDetectorComponent implements OnInit {

  detectorId: string = "";
  analysisId: string = "";
  detectorName: string = "";
  searchTerm: string = "";
  showSearchBar: boolean = false;
  searchBarFocus: boolean = false;
  isPublic: boolean = false;
  cxpChatTrackingId: string = '';
  cxpChatUrl: string = ''; 

  constructor(private _activatedRouteLocal: ActivatedRoute, private _diagnosticServiceLocal: DiagnosticService, _resourceService: ResourceService, _authServiceInstance: AuthService, _telemetryService: TelemetryService,
    _navigator: FeatureNavigationService, private _routerLocal: Router, private _supportTopicService:GenericSupportTopicService,
    @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    super(_activatedRouteLocal, _diagnosticServiceLocal, _resourceService, _authServiceInstance, _telemetryService, _navigator, _routerLocal);
    this.isPublic = config && config.isPublic;
  }

  ngOnInit() {
    if (this.isPublic) {
      //this.renderCXPChatButton();
    }
    this._activatedRouteLocal.paramMap.subscribe(params => {
      this.analysisId = params.get('analysisId');
      this.detectorId = params.get('detectorName') === null ? "" : params.get('detectorName');
      this._activatedRouteLocal.queryParamMap.subscribe(qParams => {
        this.searchTerm = qParams.get('searchTerm') === null ? "" : qParams.get('searchTerm');
        if (this.analysisId=== "searchResultsAnalysis" && this.searchTerm && this.searchTerm.length>0){
          this.showSearchBar = true;
        }

        this._diagnosticServiceLocal.getDetectors().subscribe(detectorList => {
          if (detectorList) {

            if (this.detectorId !== "") {
              let currentDetector = detectorList.find(detector => detector.id == this.detectorId)
              this.detectorName = currentDetector.name;
            }
          }
        });
      });
    });
  }

  triggerSearch(){
    if (this.searchTerm && this.searchTerm.length>1) {
      this.searchBarFocus = false;
      var searchBar = document.getElementById('caseSubmissionFlowSearchBar');
      searchBar.blur();
      this._routerLocal.navigate([`../../${this.analysisId}/search`], { relativeTo: this._activatedRouteLocal, queryParamsHandling: 'merge', queryParams: {searchTerm: this.searchTerm} });
    }
  }

  focusSearch(){
    var searchBar = document.getElementById('caseSubmissionFlowSearchBar');
    searchBar.focus();
    this.searchBarFocus = true;
  }

  goBackToAnalysis() {
    if (this.analysisId=== "searchResultsAnalysis" && this.searchTerm){
      this._routerLocal.navigate([`../../../../${this.analysisId}/search`], { relativeTo: this._activatedRouteLocal, queryParamsHandling: 'merge', queryParams: {searchTerm: this.searchTerm} });
    }
    else{
      this._routerLocal.navigate([`../../../${this.analysisId}`], { relativeTo: this._activatedRouteLocal, queryParamsHandling: 'merge' });
    }
  }

  showChatButton():boolean {
    return true;//this.isPublic && this.cxpChatTrackingId != '' && this.cxpChatUrl != '';
  }

  /*renderCXPChatButton(){    
    if(this.cxpChatTrackingId === '' && this.cxpChatUrl === '') {
      if(this._supportTopicService && this._cxpChatService && this._cxpChatService.isSupportTopicEnabledForLiveChat(this._supportTopicService.supportTopicId)) {        
          this.cxpChatTrackingId = this._cxpChatService.generateTrackingId();
          this._cxpChatService.getChatURL(this._supportTopicService.supportTopicId, this.cxpChatTrackingId).subscribe((chatApiResponse:any)=>{
            if (chatApiResponse && chatApiResponse != '') {
              this.cxpChatUrl = chatApiResponse;
            }
          });               
      }
    }
  }*/

}
