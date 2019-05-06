import { Component, OnInit, OnChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';

@Component({
  selector: 'tab-analysis',
  templateUrl: './tab-analysis.component.html',
  styleUrls: ['./tab-analysis.component.scss']
})

export class TabAnalysisComponent implements OnInit {

  analysisId: string;
  detectorId: string;
  detectorName: string;

  constructor(private _activatedRoute: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService) {
    this._activatedRoute.paramMap.subscribe(params => {
      this.analysisId = params.get('analysisId');
      this.detectorId = params.get('detector') === null ? "" : params.get('detector');
    });

  }

  ngOnInit() {
    this._diagnosticService.getDetectors().subscribe(detectorList => {
      if (detectorList) {
        if (this.detectorId !== "") {
          let currentDetector = detectorList.find(detector => detector.id == this.detectorId)
          this.detectorName = currentDetector.name;
        }
      }
    });
  }

}
