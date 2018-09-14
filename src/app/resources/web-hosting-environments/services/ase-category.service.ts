import { Injectable } from '@angular/core';
import { Category } from '../../../shared-v2/models/category';
import { CategoryService } from '../../../shared-v2/services/category.service';

@Injectable()
export class AseCategoryService extends CategoryService {

  private _aseCategories: Category[] = [
    {
        id: 'Networking',
        name: 'Networking',
        description: 'This is a networking descriptions which Jen needs to provide to me',
        keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: true
    }
  ]

  constructor() { 
    super();
    this._addCategories(this._aseCategories);
  }
}
