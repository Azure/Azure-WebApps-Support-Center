import { Component, OnInit, OnChanges, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { DetectorListAnalysisComponent } from 'diagnostic-data';
import { DownTime } from 'diagnostic-data';

@Component({
  selector: 'tab-analysis',
  templateUrl: './tab-analysis.component.html',
  styleUrls: ['./tab-analysis.component.scss']
})

export class TabAnalysisComponent implements OnInit {

  analysisId: string;
  detectorName: string;
  downTime: DownTime;

  @ViewChild('detectorListAnalysis', {static:true}) detectorListAnalysis: DetectorListAnalysisComponent

  constructor(private _activatedRoute: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService) {
    this._activatedRoute.paramMap.subscribe(params => {
      this.analysisId = params.get('analysisId');
    });

  }

  ngOnInit() {
  }
  onActivate(event) {
    window.scroll(0, 0);
  }

  onDowntimeChanged(event: DownTime) {
    this.detectorListAnalysis.downTime = event;
  }
}
