
import { map, flatMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { DiagnosticService, DetectorMetaData, DetectorType } from 'diagnostic-data';
import { Observable } from 'rxjs';
import 'rxjs/add/observable/of';
import { ResourceService } from './resource.service';
import {AuthService} from '../../startup/services/auth.service';

@Injectable()
export class SupportTopicService {

  protected detectorTask: Observable<DetectorMetaData[]>;
  public supportTopicId: string = "";
  public pesId: string = "";
  private selfHelpContentUrl = "https://mpac.support.ext.azure.com/api/v1/selfHelpArticles?articleTypes=Generic&articleTypes=Resource";
  private supportTopicConfig = {
    "14748": ["32444077", "32444080", "32444081", "32444082", "32444083", "32444084", "32550703"]
  };

  constructor(protected _http: Http, protected _authService: AuthService, protected _diagnosticService: DiagnosticService, protected _webSiteService: ResourceService) {
  }

  public getSelfHelpContentDocument(): Observable<any>{
    if (this.pesId && this.pesId.length>0 && this.supportTopicId && this.supportTopicId.length>0){
      return this._authService.getStartupInfo().pipe(flatMap(res => {
        var selfHelpContentForSupportTopicUrl = this.selfHelpContentUrl + "&productId=" + encodeURIComponent(this.pesId) + "&topicId=" + encodeURIComponent(this.supportTopicId);
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${res.token}`);
        return this._http.get(selfHelpContentForSupportTopicUrl, {
          headers: headers
        });
      }));
    }
    return Observable.of(null);
  }

  getPathForSupportTopic(supportTopicId: string, pesId: string, searchTerm: string): Observable<any>{
    this.supportTopicId = supportTopicId;
    return this._webSiteService.getPesId().pipe(flatMap(pesId => {
      this.pesId = pesId;
      if (this.supportTopicConfig.hasOwnProperty(this.pesId) && this.supportTopicConfig[this.pesId].findIndex(spId => spId===supportTopicId)>=0){
          return Observable.of({path: `/analysis/searchResultsAnalysis/search`, queryParams: {"searchTerm": searchTerm}});
      }
      else{
          this.detectorTask = this._diagnosticService.getDetectors();
          return this.detectorTask.pipe(map(detectors => {
            let detectorPath = '';
      
            if (detectors) {
              const matchingDetector = detectors.find(detector =>
                detector.supportTopicList &&
                detector.supportTopicList.findIndex(supportTopic => supportTopic.id === supportTopicId) >= 0);
      
              if (matchingDetector) {
                if (matchingDetector.type === DetectorType.Detector) {
                  detectorPath = `/detectors/${matchingDetector.id}`;
                } else if (matchingDetector.type === DetectorType.Analysis) {
                  detectorPath = `/analysis/${matchingDetector.id}`;
                }
              }
            }    
            return {path: detectorPath, queryParams: {"searchTerm": searchTerm}};
          }));
      }
    }));
  }
}
