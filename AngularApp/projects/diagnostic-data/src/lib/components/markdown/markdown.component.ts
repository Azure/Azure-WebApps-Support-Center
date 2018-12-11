import { Component, Inject } from '@angular/core';
import { Rendering, DiagnosticData } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { MarkdownService } from 'ngx-markdown';
import { ClipboardService } from '../../services/clipboard.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';

@Component({
  selector: 'markdown-view',
  templateUrl: './markdown.component.html',
  styleUrls: ['./markdown.component.scss']
})
export class MarkdownComponent extends DataRenderBaseComponent {

  renderingProperties: Rendering;

  markdown: string;
  isPublic: boolean;

  constructor(private _markdownService: MarkdownService, private _clipboard: ClipboardService, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, protected telemetryService: TelemetryService) {
    super(telemetryService);
    this.isPublic = config && config.isPublic;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <Rendering>data.renderingProperties;

    this.createViewModel();
  }

  private createViewModel() {
    let rows = this.diagnosticData.table.rows;
    if (rows.length > 0 && rows[0].length > 0) {
      this.markdown = rows[0][0];
    }
  }

  copyMarkdown() {
    let markdownHtml = this._markdownService.compile(this.markdown);
    this._clipboard.copyAsHtml(markdownHtml);

    // Send telemetry event for clicking copyMarkdown
    let copytoEmailEventProps: { [name: string]: string } = {
      "Title": this.renderingProperties.title,
      "ButtonClicked": "Copy to Email"
    };
    this.logEvent(TelemetryEventNames.MarkdownClicked, copytoEmailEventProps);
  }

  openEmail() {
    let markdownHtml = this._markdownService.compile(this.markdown);
    let mailto = this.emailTemplate.replace('{body}', markdownHtml);
    let data = new Blob([mailto], { type: 'text/plain' });
    let textFile = window.URL.createObjectURL(data);

    this.download('CaseEmail.eml', textFile);

    // Send telemetry event for clicking openEmail
    let openOutlookEventProps: { [name: string]: string } = {
      "Title": this.renderingProperties.title,
      "ButtonClicked": "Open in Outlook"
    };
    this.logEvent(TelemetryEventNames.MarkdownClicked, openOutlookEventProps);
  }

  download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', text);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  readonly emailTemplate = `To: 
Subject: Case Email
X-Unsent: 1
Content-Type: text/html

<!DOCTYPE html>
<html>
<body>
    {body}
</body>
</html>`
}