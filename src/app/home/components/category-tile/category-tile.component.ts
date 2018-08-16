import { Component, OnInit, Input } from '@angular/core';
import { Category } from '../../../shared-v2/models/category';
import { ActivatedRoute, NavigationExtras, Router } from '../../../../../node_modules/@angular/router';

@Component({
  selector: 'category-tile',
  templateUrl: './category-tile.component.html',
  styleUrls: ['./category-tile.component.css']
})
export class CategoryTileComponent implements OnInit {

  @Input() category: Category;

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute) { }

  ngOnInit() {
  }

  navigateToCategory() {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };
    //console.log('navigate to' + this.category.id);

    let path = this.category.overridePath ? this.category.overridePath.split('/').filter(s => s !== '') : ['categories', this.category.id];

    console.log('navigate to');
    console.log(path);

    this._router.navigate(path, navigationExtras);
  }
}
