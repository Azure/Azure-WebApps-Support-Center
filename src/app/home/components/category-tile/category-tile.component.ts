import { Component, OnInit, Input } from '@angular/core';
import { Category } from '../../../shared-v2/models/category';
import { ActivatedRoute, NavigationExtras, Router } from '../../../../../node_modules/@angular/router';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'category-tile',
  templateUrl: './category-tile.component.html',
  styleUrls: ['./category-tile.component.css']
})
export class CategoryTileComponent implements OnInit {

  @Input() category: Category;

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _notificationService: NotificationService) { }

  ngOnInit() {
  }

  navigateToCategory(): void {
  
    if (this.category.overridePath) {
      console.log('override path:' + this.category.overridePath);
      this._router.navigateByUrl(this.category.overridePath);
      return;
    }

    let path = ['categories', this.category.id];

    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };

    this._notificationService.dismiss();

    console.log('navigate to' + path);

    this._router.navigate(path, navigationExtras);
  }
}
