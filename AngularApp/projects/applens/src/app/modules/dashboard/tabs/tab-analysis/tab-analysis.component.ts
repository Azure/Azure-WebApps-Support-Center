import { Component, OnInit, OnChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';

@Component({
  selector: 'tab-analysis',
  templateUrl: './tab-analysis.component.html',
  styleUrls: ['./tab-analysis.component.scss']
})
export class TabAnalysisComponent implements OnInit, OnChanges {

  analysisId: string;
  detectorId: string;
  contentHeight: string;
  detectors: any[] = [];
  constructor(private _route: ActivatedRoute, private _diagnosticApiService: ApplensDiagnosticService) {
    this.contentHeight = (window.innerHeight - 112) + 'px';
  }

  ngOnInit() {

    this._route.paramMap.subscribe(params => {
      this.analysisId = params.get('analysis');
      this.detectorId = params.get('detector') === null ? "" : params.get('detector');

      this.detectors = [];
      this._diagnosticApiService.getDetectors().subscribe(detectorList => {
        if (detectorList) {
          detectorList.forEach(element => {
            if (element.analysisTypes.length > 0) {
              element.analysisTypes.forEach(analysis => {
                if (analysis === this.analysisId) {
                  let link: any[] = ['/analysis', this.analysisId, element.id];
                  // routerLink.push('analysis');
                  // routerLink.push(this.analysisId);
                  // routerLink.push(element.id);
                  this.detectors.push({ routerLink: '/appAnalysis/coldstarts', name: element.name });
                }
              });
            }
          })
        }
      });
    });
  }
  ngOnChanges() {

  }

}
