import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteSupportTopicService } from '../../../resources/web-sites/services/site-support-topic.service';

@Component({
  selector: 'support-topic-redirect',
  templateUrl: './support-topic-redirect.component.html',
  styleUrls: ['./support-topic-redirect.component.css']
})
export class SupportTopicRedirectComponent implements OnInit {

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router, private _supportTopicService: SiteSupportTopicService) { }

  ngOnInit() {
    this._supportTopicService.getPathForSupportTopic(this._activatedRoute.snapshot.queryParams.supportTopicId, this._activatedRoute.snapshot.queryParams.pesId).subscribe(path => {
      this._router.navigateByUrl(path);
    });
  }

}
