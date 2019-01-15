import { Insight } from './../../models/insight';
import { Component, OnInit, Input } from '@angular/core';
import { DetectorResponse } from '../../models/detector';
import { InsightUtils } from '../../models/insight';
import { TelemetryService } from '../../services/telemetry/telemetry.service';

@Component({
  selector: 'copy-insight-details',
  templateUrl: './copy-insight-details.component.html',
  styleUrls: ['./copy-insight-details.component.scss']
})
export class CopyInsightDetailsComponent implements OnInit {

  insightCopyText: string = '';

  @Input() detectorResponse: DetectorResponse;

  constructor(private _logger: TelemetryService) { }

  ngOnInit() {
    this.createMarkdownText(InsightUtils.parseAllInsightsFromResponse(this.detectorResponse));
    this._logger.logEvent('report-copy', { buttonSource: 'main', edited: 'false' });
  }

  createMarkdownText(insights: Insight[]) {
    if (!insights || insights.length === 0) {
      this.insightCopyText = 'No insights in this detector';
    }
    else {
      insights.forEach(insight => {
        this.insightCopyText += '## ' + insight.title + '\n\n';
        for (let key in insight.data) {
          this.insightCopyText += `### ${key}\n\n`;
          let data = insight.data[key].replace('<markdown>','').replace('</markdown>', '');
          let lines = data.split(/\r?\n/);
          for(let i in lines) {
            this.insightCopyText += lines[i].trim() + '\n';
          }

          this.insightCopyText += '\n'
        }
        this.insightCopyText += '\n***\n';
      });
    }
  }
}
