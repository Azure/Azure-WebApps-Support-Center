import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'data-container',
  templateUrl: './data-container.component.html',
  styleUrls: ['./data-container.component.scss']
})
export class DataContainerComponent {

  @Input() headerTemplate: TemplateRef<any>;

  @Input() title: string;
  @Input() description: string;
  @Input() noBodyPadding: boolean = false;

  @Input() hideIfNoTitle: boolean = true;

  @Input() applicationInsightContainerStyle: number = 0;

  @Input() detector: string = "";


  isMarkdown(str: string) {
    return str.trim().startsWith('<markdown>') && str.endsWith('</markdown>');
  }

  getMarkdown(str: string) {
    return str.trim().replace('<markdown>', '').replace('</markdown>', '');
  }

  // ngAfterViewInit() {
  //   if (this.markdownDiv) {
  //     this.listenObj = this.renderer.listen(this.markdownDiv.element.nativeElement, 'click', (evt) => this._interceptorService.interceptLinkClick(evt, this.router, this.detector, this.telemetryService));
  //   }
  // }
}
