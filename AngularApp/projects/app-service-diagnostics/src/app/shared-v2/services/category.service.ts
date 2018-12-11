import { Injectable } from '@angular/core';
import { Category } from '../models/category';
import { DiagnosticService } from 'diagnostic-data';
import { BehaviorSubject } from 'rxjs'

@Injectable()
export class CategoryService {

  public categories: BehaviorSubject<Category[]> = new BehaviorSubject<Category[]>(null);

  private _categories: Category[] = [];

  private _commonCategories: Category[] = [];

  constructor() {
    this._addCategories(this._commonCategories)
  }

  protected _addCategories(categories: Category[]) {
    this._categories = this._categories.concat(categories);
    this.categories.next(this._categories);
  }
}
