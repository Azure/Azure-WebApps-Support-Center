import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DiagnosticService } from 'diagnostic-data';

@Component({
  selector: 'analysis-view',
  templateUrl: './analysis-view.component.html',
  styleUrls: ['./analysis-view.component.scss']
})
export class AnalysisViewComponent implements OnInit {

  analysisId: string;
  detectorId: string;
  contentHeight: string;
  detectors: any[] = [];

  constructor(private _route: ActivatedRoute, private _diagnosticService: DiagnosticService) { }

  ngOnInit() {
    this._route.paramMap.subscribe(params => {
      this.analysisId = params.get('analysis');
      this.detectorId = params.get('detector') === null ? "" : params.get('detector');

      this.detectors = [];
      this._diagnosticService.getDetectors().subscribe(detectorList => {
        if (detectorList) {
          detectorList.forEach(element => {
            if (element.analysisTypes != null && element.analysisTypes.length > 0) {
              element.analysisTypes.forEach(analysis => {
                if (analysis === this.analysisId) {
                  let link: any[] = [];

                  if (this.detectorId !== "") {
                    link = ['../' + element.id];
                  } else {
                    link = ['./' + element.id];
                  }
                  this.detectors.push({ routerLink: link, name: element.name });
                }
              });
            }
          })
        }
      });
    });
  }
}
