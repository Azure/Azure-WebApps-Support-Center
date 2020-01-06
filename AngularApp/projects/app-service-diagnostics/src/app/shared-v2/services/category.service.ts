import { Injectable } from '@angular/core';
import { Category } from '../models/category';
import { DiagnosticService } from 'diagnostic-data';
import { BehaviorSubject } from 'rxjs';
import { GenericArmConfigService } from '../../shared/services/generic-arm-config.service';
import { ArmResourceConfig } from '../../shared/models/arm/armResourceConfig';
@Injectable()
export class CategoryService {

  public categories: BehaviorSubject<Category[]> = new BehaviorSubject<Category[]>(null);

  private _categories: Category[] = [];

  private _commonCategories: Category[] = [];

  constructor(private _genericArmConfigService?: GenericArmConfigService) {
    this._addCategories(this._commonCategories);
  }

  public initCategoriesForArmResource(resourceUri: string) {
    if (this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(resourceUri);
      if (currConfig.categories && currConfig.categories.length > 0) {
        this._addCategories(currConfig.categories);
      }
    }
  }

  protected _addCategories(categories: Category[]) {
    this._categories = this._categories.concat(categories);
    this.categories.next(this._categories);
  }

  public filterCategoriesForSub() {
    this._categories = this._categories.filter( function(category) {
        return category.id !== 'navigator';
    });
    this.categories.next(this._categories);
  }
}
