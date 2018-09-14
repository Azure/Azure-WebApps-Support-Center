import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { NotificationService, Notification } from '../../../shared/services/notification.service';
import { Router } from '@angular/router';
import { DetectorControlService } from 'applens-diagnostics';
import { FeatureService } from '../../../shared-v2/services/feature.service';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  resourceName: string;

  categories: Category[];

  searchValue: string;
  searchBoxFocus: boolean;

  constructor(private _resourceService: ResourceService, private _categoryService: CategoryService, private _notificationService: NotificationService, private _router: Router,
    private _detectorControlService: DetectorControlService, private _featureService: FeatureService) { 
    this._categoryService.categories.subscribe(categories => this.categories = categories);
  }

  ngOnInit() {
    this.resourceName = this._resourceService.resource.name;
    this._detectorControlService.setDefault();
    setTimeout(() => {
      let notification = new Notification('This is the new Diagnose and Solve Experience. Click here to return to the old experience', () => { 
        this._router.navigateByUrl(`legacy${this._resourceService.resourceIdForRouting}/diagnostics`);
        this._notificationService.dismiss();
      });
      this._notificationService.pushNotification(notification)
    }, 100)
  }

  onSearchBoxFocus(event: any): void {
    this.searchBoxFocus = true;
  }

  clearSearch() {
    this.searchBoxFocus = false;
    this.searchValue = '';
  }
}
