import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../shared-v2/services/notification.service';

@Component({
  selector: 'notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {

  constructor(public notificationService: NotificationService) { }

  ngOnInit() {
  }

}
