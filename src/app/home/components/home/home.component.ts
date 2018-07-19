import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  resourceName: string;

  categories: Category[];

  constructor(private _resourceService: ResourceService, private _categoryService: CategoryService) { 
    this.categories = this._categoryService.categories;
  }

  ngOnInit() {
    this.resourceName = this._resourceService.resource.name;
  }
}
