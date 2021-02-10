import { Injectable } from '@angular/core';
import { Category } from '../../../shared-v2/models/category';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { WebHostingEnvironmentsService } from './web-hosting-environments.service';

@Injectable()
export class AseCategoryService extends CategoryService {
  private _aseCategories: Category[] = [
    {
        id: 'Networking',
        name: 'Networking',
        overviewDetectorId: 'Networking',
        description: 'Sometimes an ASE can be unhealthy and scaling operations can take a long time due to changes in NSG, UDRs, Express Route that may inadvertently harm the ASE. Find out if your network setup is configured correctly for your ASE.',
        keywords: ['NSG', 'Connectivity', 'Outbound Connections', 'Subnet'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: true,
        chatEnabled: false
    },
    {
      id: 'Scaling',
      name: 'Scaling',
      overviewDetectorId: 'Scaling',
      description: 'Find out the current status of your scale operations, why your scale operations may be taking a long time, or why they are failing',
      keywords: ['Scale Up', 'Scale Out', 'Deployment', 'Stuck'],
      color: 'rgb(249, 213, 180)',
      createFlowForCategory: true,
      chatEnabled: false
    }
  ];

  constructor(private _resourceService: WebHostingEnvironmentsService) {
    super();
    this._resourceService.getAseVersion().subscribe((aseVersion) => {
        if (aseVersion.toLowerCase() === "asev3")
        {
            this._aseCategories.forEach((aseCategory) => {
                aseCategory.overridePath = `resource${this._resourceService.resourceIdForRouting}/categoriesv3/${aseCategory.id}/Asev3Customview`;
            })
        }
    });

    this._addCategories(this._aseCategories);
  }
}
