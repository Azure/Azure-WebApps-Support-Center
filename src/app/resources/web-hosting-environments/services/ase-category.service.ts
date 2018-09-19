import { Injectable } from '@angular/core';
import { Category } from '../../../shared-v2/models/category';
import { CategoryService } from '../../../shared-v2/services/category.service';

@Injectable()
export class AseCategoryService extends CategoryService {

  private _aseCategories: Category[] = [
    {
        id: 'Networking',
        name: 'Networking',
        description: 'Check the network health of your App Service Environment. Run an NSG check to make sure your ASE can operate properly.',
        keywords: ['NSG', 'Connectivity', 'Outbound Connections', 'Subnet'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: true
    },
    {
      id: 'Scaling',
      name: 'Scaling',
      description: 'Find out the current status of your scale operations, why your scale operations may be taking a long time, or why they are failing',
      keywords: ['Scale Up', 'Scale Out', 'Deployent', 'Stuck'],
      color: 'rgb(208, 175, 239)',
      createFlowForCategory: true
  }
  ]

  constructor() { 
    super();
    this._addCategories(this._aseCategories);
  }
}
