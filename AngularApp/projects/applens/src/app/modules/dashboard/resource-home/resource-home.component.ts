import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import { CollapsibleMenuItem } from '../../../collapsible-menu/components/collapsible-menu-item/collapsible-menu-item.component';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { DiagnosticService } from 'diagnostic-data';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';

@Component({
  selector: 'resource-home',
  templateUrl: './resource-home.component.html',
  styleUrls: ['./resource-home.component.scss']
})
export class ResourceHomeComponent implements OnInit {

  currentRoutePath: string[];
  categories: CollapsibleMenuItem[] = [];
  resource: any;
  keys: string[];

  detectorsWithSupportTopics: DetectorMetaData[];

  supportTopicIdMapping: any[] = [];

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _resourceService: ResourceService,private _diagnosticService:  DiagnosticService) { }

  ngOnInit() {
    this._resourceService.getCurrentResource().subscribe(resource => {
      if (resource) {
        this.resource = resource;
        this.keys = Object.keys(this.resource);
      }
    });

    this._diagnosticService.getDetectors().subscribe(detectors => {
      this.detectorsWithSupportTopics = detectors.filter(detector => detector.supportTopicList && detector.supportTopicList.length > 0);

      this.detectorsWithSupportTopics.forEach(detector => {
        detector.supportTopicList.forEach(supportTopic => {
          this.supportTopicIdMapping.push({ supportTopic : supportTopic, detectorName: detector.name });
        });
      });

      
      if (detectors) {
        detectors.forEach(element => {
          let onClick = () => {
            this.navigateTo(`detectors/${element.id}`);
          };

          let isSelected = () => {
            return this.currentRoutePath && this.currentRoutePath.join('/') === `detectors/${element.id}`;
          };

          let category = element.category ? element.category : "Uncategorized";
          let menuItem = new CollapsibleMenuItem(element.name, onClick, isSelected);

          let categoryMenuItem = this.categories.find((cat: CollapsibleMenuItem) => cat.label === category);
          if (!categoryMenuItem) {
            categoryMenuItem = new CollapsibleMenuItem(category, null, null, null, true);
            this.categories.push(categoryMenuItem);
          }

          categoryMenuItem.subItems.push(menuItem);
        });

        this.categories = this.categories.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));
      }
  });



  // getSupportTopicIdFormatted(supportTopicList: SupportTopic[]) {
  //   return supportTopicList.map(supportTopic => `${supportTopic.pesId} - ${supportTopic.id}`).join('/r/n');
  // }
}

  
navigateTo(path: string) {
  let navigationExtras: NavigationExtras = {
    queryParamsHandling: 'preserve',
    preserveFragment: true,
    relativeTo: this._activatedRoute
  };

  this._router.navigate(path.split('/'), navigationExtras);
}
}
