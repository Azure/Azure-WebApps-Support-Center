import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportTopicService } from '../../../shared-v2/services/support-topic.service';
import { AuthService } from '../../../startup/services/auth.service';
import { NotificationService, Notification } from '../../../shared-v2/services/notification.service';

@Component({
  selector: 'support-topic-redirect',
  templateUrl: './support-topic-redirect.component.html',
  styleUrls: ['./support-topic-redirect.component.scss']
})
export class SupportTopicRedirectComponent implements OnInit {

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router, private _supportTopicService: SupportTopicService, private _authService: AuthService,
    private _notificationService: NotificationService) { }

  ngOnInit() {
    this._supportTopicService.getPathForSupportTopic(this._activatedRoute.snapshot.queryParams.supportTopicId, this._activatedRoute.snapshot.queryParams.pesId).subscribe(path => {
      this._router.navigate([`../${path}`], { relativeTo: this._activatedRoute });

      this._authService.getStartupInfo().subscribe(startupInfo => {

        if (startupInfo.source && startupInfo.source.toLowerCase() == ('CaseSubmissionV2-NonContext').toLowerCase()) {
          const notification = new Notification('To continue with case submission, close App Service Diagnostics', null, 'fa-info-circle');
          this._notificationService.pushNotification(notification);
        }
      });
    });
  }
}
