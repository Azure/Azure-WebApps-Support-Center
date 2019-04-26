import { Component, OnInit, Output, ElementRef, HostListener, EventEmitter } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { DiagnosticService } from 'diagnostic-data';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { map, mergeMap } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';

@Component({
  selector: 'resource-home',
  templateUrl: './resource-home.component.html',
  styleUrls: ['./resource-home.component.scss']
})
export class ResourceHomeComponent implements OnInit {
  @Output()
  public clickOutsideCategory = new EventEmitter();

  currentRoutePath: string[];
  categories: ExpandableCardItem[] = [];
  resource: any;
  keys: string[];
  activeCategoryName: string = undefined;
  activeRow: number = undefined;

  detectorsWithSupportTopics: DetectorMetaData[];
  detectorsPublicOrWithSupportTopics: DetectorMetaData[] = [];

  supportTopicIdMapping: any[] = [];

  constructor(private _elementRef : ElementRef, private _router: Router, private _activatedRoute: ActivatedRoute, private _resourceService: ResourceService,private _diagnosticService:  DiagnosticService) { }

  ngOnInit() {
    this._resourceService.getCurrentResource().subscribe(resource => {
      if (resource) {
        this.resource = resource;
        this.keys = Object.keys(this.resource);
      }
    });

    const detectorsWithSupportTopics = this._diagnosticService.getDetectors().pipe(map((detectors: DetectorMetaData[]) => {
        this.detectorsWithSupportTopics = detectors.filter(detector => detector.supportTopicList && detector.supportTopicList.length > 0);

        this.detectorsWithSupportTopics.forEach(detector => {
          detector.supportTopicList.forEach(supportTopic => {
            this.supportTopicIdMapping.push({ supportTopic : supportTopic, detectorName: detector.name });
          });
        });

        return this.detectorsWithSupportTopics;
    }));

    // this._diagnosticService.getDetectors().subscribe(detectors => {
    //   this.detectorsWithSupportTopics = detectors.filter(detector => detector.supportTopicList && detector.supportTopicList.length > 0);

    //   this.detectorsWithSupportTopics.forEach(detector => {
    //     detector.supportTopicList.forEach(supportTopic => {
    //       this.supportTopicIdMapping.push({ supportTopic : supportTopic, detectorName: detector.name });
    //     });


    //   });

      const publicDetectors = this._diagnosticService.getDetectors(false);

      forkJoin(detectorsWithSupportTopics, publicDetectors).subscribe((detectorLists) => {
          console.log("ForkJoin result");
          console.log(detectorLists);
        // if (!this.detectorsPublicOrWithSupportTopics.find((existingDetector) => existingDetector.id === detector.id))
        // {
        //     console.log("Find a internal detector with support topic");
        //     this.detectorsPublicOrWithSupportTopics.push(detector);
        // }
        // else
        // {
        //     console.log("didn't find internal detector with support topic");
        //     console.log(`internal: ${detector.id}, existing: `);
        //     console.log(this.detectorsPublicOrWithSupportTopics);
        // }
        detectorLists.forEach((detectorList: DetectorMetaData[]) => {
            detectorList.forEach(detector =>{
                if (!this.detectorsPublicOrWithSupportTopics.find((existingDetector) => existingDetector.id === detector.id))
                {
                    console.log("Find a detector with support topic");
                    this.detectorsPublicOrWithSupportTopics.push(detector);
                }
            });

            this.detectorsPublicOrWithSupportTopics.forEach(element => {
            let onClick = () => {
              this.navigateTo(`detectors/${element.id}`);
            };

            let isSelected = () => {
              return this.currentRoutePath && this.currentRoutePath.join('/') === `detectors/${element.id}`;
            };

            let category = element.category ? element.category : "Uncategorized";
            let menuItem = new ExpandableCardItem(element.name, element.description, element.author, onClick, isSelected);

            let categoryMenuItem = this.categories.find((cat: ExpandableCardItem) => cat.label === category);
            if (!categoryMenuItem) {
              categoryMenuItem = new ExpandableCardItem(category, null, null, null, null, null, true);
              this.categories.push(categoryMenuItem);
            }

            categoryMenuItem.subItems.push(menuItem);
          });

          this.categories = this.categories.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));
        });
      });

    //   .subscribe(detectors => {
    //     detectors.forEach(detector => {
    //         if (!this.detectorsPublicOrWithSupportTopics.find((existingDetector) => existingDetector.id === detector.id))
    //         {
    //             console.log("Find a public detector");
    //             this.detectorsPublicOrWithSupportTopics.push(detector);
    //         }
    //     });
    //   });

      if (this.detectorsPublicOrWithSupportTopics) {
          console.log("Detectors List that will show");
          console.log(this.detectorsPublicOrWithSupportTopics);
        this.detectorsPublicOrWithSupportTopics.forEach(element => {
          let onClick = () => {
              console.log("Click subcategory's navigation onclick");
            this.navigateTo(`detectors/${element.id}`);
          };

          let isSelected = () => {
            return this.currentRoutePath && this.currentRoutePath.join('/') === `detectors/${element.id}`;
          };

          let category = element.category ? element.category : "Uncategorized";
          let menuItem = new ExpandableCardItem(element.name, element.description, element.author, onClick, isSelected);

          let categoryMenuItem = this.categories.find((cat: ExpandableCardItem) => cat.label === category);
          if (!categoryMenuItem) {
            categoryMenuItem = new ExpandableCardItem(category, null, null, null, null, null, true);
            this.categories.push(categoryMenuItem);
          }

          categoryMenuItem.subItems.push(menuItem);
        });

        this.categories = this.categories.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));
      }
  };



  // getSupportTopicIdFormatted(supportTopicList: SupportTopic[]) {
  //   return supportTopicList.map(supportTopic => `${supportTopic.pesId} - ${supportTopic.id}`).join('/r/n');
  // }


setActiveCategory (name: string, index: number) {
  this.activeCategoryName = name;
  this.activeRow = Math.floor(index/4);
}

clickAction(subcategory: ExpandableCardItem)
{
    subcategory.onClick();
    console.log(subcategory);
    console.log("Inner action");
}

inActiveRow (index: number) {
  return this.activeRow === Math.floor(index/4);
}

@HostListener('document:click', ['$event.target'])
public onClick(targetElement) {
   // const clickedInside = this._elementRef.nativeElement.contains(targetElement);

    const clickedOutside = targetElement.className === "category-container" || targetElement.className === "outer-container";
    if (clickedOutside)
    {
      this.activeCategoryName = undefined;
    }
    // if (!clickedInside) {
    //     this.clickOutsideCategory.emit(null);
    // }
}

navigateTo(path: string) {
  let navigationExtras: NavigationExtras = {
    queryParamsHandling: 'preserve',
    preserveFragment: true,
    relativeTo: this._activatedRoute
  };

  console.log("navigation params");
  console.log(navigationExtras);
  //this._router.navigate(path.split('/'), navigationExtras);
  this._router.navigate([`../${path}`], navigationExtras);
}
}

export class ExpandableCardItem {
  label: string;
  description: string;
  author: string;
  onClick: Function;
  expanded: boolean = false;
  subItems: ExpandableCardItem[];
  isSelected: Function;
  icon: string;

  constructor(label: string, description: string, author: string, onClick: Function, isSelected: Function, icon: string = null, expanded: boolean = false, subItems: ExpandableCardItem[] = []) {
    this.label = label;
    this.description = description;
    this.author = author;
    this.onClick = onClick;
    this.expanded = expanded;
    this.subItems = subItems;
    this.isSelected = isSelected;
    this.icon = icon;
  }
}
