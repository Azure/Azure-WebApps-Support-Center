import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SupportTopicItem, SupportTopicResult } from '../resource-home/resource-home.component';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { AvatarModule } from 'ngx-avatar';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { MarkdownService } from 'ngx-markdown';

@Component({
  selector: 'self-help-content',
  templateUrl: './self-help-content.component.html',
  styleUrls: ['./self-help-content.component.scss']
})
export class SelfHelpContentComponent implements OnInit {
  pesId: string = "";
  supportTopicId: string = "";
  selfHelpPath: string="microsoft.web";
  selfHelpContent: string="";
  title: string="";

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _http: HttpClient, private _resourceService: ResourceService, private _diagnosticService: ApplensDiagnosticService, private _supportTopicService: ApplensSupportTopicService, private _markdownService: MarkdownService,) { }

  ngOnInit() {
    this.pesId = this._activatedRoute.snapshot.params['pesId'];
    this.supportTopicId = this._activatedRoute.snapshot.params['supportTopicId'];
    this.selfHelpPath = this._supportTopicService.getSelfHelpPath();

    this._diagnosticService.getSelfHelpContent(this.pesId, this.supportTopicId, this.selfHelpPath).subscribe((res) => {
      this.selfHelpContent = res;
      console.log(this.pesId);
      console.log(this.supportTopicId);
      console.log(this.selfHelpPath);
      console.log(this.selfHelpContent);
    });
  }

}
