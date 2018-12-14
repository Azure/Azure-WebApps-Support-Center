import { Injectable } from '@angular/core';
import { Category } from '../../../shared-v2/models/category';
import { CategoryService } from '../../../shared-v2/services/category.service';

@Injectable()
export class AseCategoryService extends CategoryService {

  private _aseCategories: Category[] = [
    {
        id: 'Networking',
        name: 'Networking',
        description: 'Sometimes an ASE can be unhealthy and scaling operations can take a long time due to changes in NSG, UDRs, Express Route that may inadvertently harm the ASE. Find out if your network setup is configured correctly for your ASE.',
        keywords: ['NSG', 'Connectivity', 'Outbound Connections', 'Subnet'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: true,
        chatEnabled: false
    },
    {
      id: 'Scaling',
      name: 'Scaling',
      description: 'Find out the current status of your scale operations, why your scale operations may be taking a long time, or why they are failing',
      keywords: ['Scale Up', 'Scale Out', 'Deployent', 'Stuck'],
      color: 'rgb(249, 213, 180)',
      createFlowForCategory: true,
      chatEnabled: false
    }
  ];

  constructor() {
    super();
    this._addCategories(this._aseCategories);
  }
}
