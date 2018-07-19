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

    this._router.navigate(['categories', this.category.id], navigationExtras);
  }
}
