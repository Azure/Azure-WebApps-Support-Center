import { Component, OnInit, Output, ElementRef, HostListener, EventEmitter } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';

@Component({
    selector: 'resource-home',
    templateUrl: './resource-home.component.html',
    styleUrls: ['./resource-home.component.scss']
})
export class ResourceHomeComponent implements OnInit {

    currentRoutePath: string[];
    categories: CategoryItem[] = [];
    resource: any;
    keys: string[];
    activeCategoryName: string = undefined;
    activeRow: number = undefined;

    authorsList: string[] = [];
    detectorsWithSupportTopics: DetectorMetaData[];
    detectorsPublicOrWithSupportTopics: DetectorMetaData[] = [];

    supportTopicIdMapping: any[] = [];
    userPhotoSrc: string;
    userPhotoSrc1: Observable<string>;


    constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _resourceService: ResourceService, private _diagnosticService: ApplensDiagnosticService, private _supportTopicService: ApplensSupportTopicService) { }

    ngOnInit() {
        this._resourceService.getCurrentResource().subscribe(resource => {
            if (resource) {
                this.resource = resource;
                this.keys = Object.keys(this.resource);
            }
        });

        this._supportTopicService.getSupportTopics().subscribe((supportTopics: SupportTopic[]) => {
            supportTopics.forEach((supportTopic) => {
                // handle the support topics service.
            });
        });

        const detectorsWithSupportTopics = this._diagnosticService.getDetectors().pipe(map((detectors: DetectorMetaData[]) => {
            this.detectorsWithSupportTopics = detectors.filter(detector => detector.supportTopicList && detector.supportTopicList.length > 0);
            return this.detectorsWithSupportTopics;
        }));

        const publicDetectors = this._diagnosticService.getDetectors(false);

        forkJoin(detectorsWithSupportTopics, publicDetectors).subscribe((detectorLists) => {
            detectorLists.forEach((detectorList: DetectorMetaData[]) => {
                detectorList.forEach(detector => {
                    if (!this.detectorsPublicOrWithSupportTopics.find((existingDetector) => existingDetector.id === detector.id)) {
                        this.detectorsPublicOrWithSupportTopics.push(detector);
                    }
                });
            });

            this.detectorsPublicOrWithSupportTopics.forEach(element => {
                let onClick = () => {
                    this.navigateTo(`detectors/${element.id}`);
                };

                let isSelected = () => {
                    return this.currentRoutePath && this.currentRoutePath.join('/') === `detectors/${element.id}`;
                };

                if (element.category)
                {
                    let menuItem = new CategoryItem(element.name, element.description, element.author, onClick, isSelected);

                    let categoryMenuItem = this.categories.find((cat: CategoryItem) => cat.label === element.category);
                    if (!categoryMenuItem) {
                        let categoryIcon = `https://applensassets.blob.core.windows.net/applensassets/${element.category}.png`;

                        categoryMenuItem = new CategoryItem(element.category, null, null, null, null, categoryIcon);
                        this.categories.push(categoryMenuItem);
                    }

                    categoryMenuItem.subItems.push(menuItem);
                }
            });

            this.categories = this.categories.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));
        });
    };

    navigateToCategory(category: CategoryItem) {
        this.navigateTo(`../categories/${category.label}`);
    }

    navigateTo(path: string) {
        let navigationExtras: NavigationExtras = {
            queryParamsHandling: 'preserve',
            preserveFragment: true,
            relativeTo: this._activatedRoute
        };

        this._router.navigate([path], navigationExtras);
    }
}

export class CategoryItem {
    label: string;
    description: string;
    author: string;
    onClick: Function;
    subItems: CategoryItem[];
    isSelected: Function;
    icon: string;

    constructor(label: string, description: string, author: string, onClick: Function, isSelected: Function, icon: string = null, subItems: CategoryItem[] = []) {
        this.label = label;
        this.description = description;
        this.author = author;
        this.onClick = onClick;
        this.subItems = subItems;
        this.isSelected = isSelected;
        this.icon = icon;
    }
}
