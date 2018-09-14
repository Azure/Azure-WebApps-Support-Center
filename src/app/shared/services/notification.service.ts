import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class NotificationService {

  activeNotification: Notification;

  notifications: Notification[] = [];

  constructor() { }

  dismiss() {
    this.activeNotification = null;
    setTimeout(() => {
      this.updateActiveNotification();
    }, 2000);
  }

  pushNotification(notification: Notification) {
    console.log(notification);
    this.notifications.push(notification);
    this.updateActiveNotification();
  }

  updateActiveNotification() {
    if (!this.activeNotification) {
      this.activeNotification = this.notifications.pop();
    }
  }
}

export class Notification {
  title: string;
  action: Function;
  icon: string;
  color: string;

  constructor(title: string, action: Function, icon?: string, color?: string) {
    this.title = title;
    this.action = action;
    this.icon = icon ? icon : 'fa-info';
    this.color = color ? color : '#dddddd';
  }
}