import { Component, OnInit, Output, ElementRef, HostListener, EventEmitter } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { DiagnosticService } from 'diagnostic-data';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';

@Component({
    selector: 'resource-home',
    templateUrl: './resource-home.component.html',
    styleUrls: ['./resource-home.component.scss']
})
export class ResourceHomeComponent implements OnInit {
    @Output()
    public clickOutsideCategory = new EventEmitter();

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


    constructor(private _elementRef: ElementRef, private _router: Router, private _activatedRoute: ActivatedRoute, private _resourceService: ResourceService, private _diagnosticService: ApplensDiagnosticService) { }

    ngOnInit() {
        this._resourceService.getCurrentResource().subscribe(resource => {
            if (resource) {
                this.resource = resource;
                this.keys = Object.keys(this.resource);
            }
        });

        this._diagnosticService.getUserPhoto("xipeng").subscribe(image => {
            // const url = window.URL;
            // const blobUrl = url.createObjectURL(image.data);
            console.log("photo source");
            this.userPhotoSrc =  'data:image/jpeg;base64,' + image;
            console.log(this.userPhotoSrc);
         //   document.getElementById("userPhoto").setAttribute("src", blobUrl);
        });

        this.userPhotoSrc1 = this._diagnosticService.getUserPhoto("shgup").pipe(map(image =>
            // const url = window.URL;
            // const blobUrl = url.createObjectURL(image.data);

            'data:image/jpeg;base64,' + image
        ));


        this.getPhoto().subscribe((image) => {
            console.log(image);
        })

        const detectorsWithSupportTopics = this._diagnosticService.getDetectors().pipe(map((detectors: DetectorMetaData[]) => {
            let authorString = "";
            detectors.forEach(detector => {
                if (detector.author != undefined && detector.author !== '' ) {
                    authorString = authorString + "," + detector.author;
                }
            });

            const separators = [' ', ',', ';', ':'];
            let authors = authorString.toLowerCase().split(new RegExp(separators.join('|'), 'g'));
            authors.forEach(author => {
                if (author && author.length > 0 && !this.authorsList.find(existingAuthor => existingAuthor === author)) {
                this.authorsList.push(author);
                }
            });

            // this.authorsList.push("patbut");
            // this.authorsList.push("shgup");

            console.log("*** All the authors");
            console.log(this.authorsList);

            this.detectorsWithSupportTopics = detectors.filter(detector => detector.supportTopicList && detector.supportTopicList.length > 0);

            this.detectorsWithSupportTopics.forEach(detector => {
                detector.supportTopicList.forEach(supportTopic => {
                    this.supportTopicIdMapping.push({ supportTopic: supportTopic, detectorName: detector.name });
                });
            });

            return this.detectorsWithSupportTopics;
        }));

        const publicDetectors = this._diagnosticService.getDetectors(false);

        forkJoin(detectorsWithSupportTopics, publicDetectors).subscribe((detectorLists) => {
            // console.log("ForkJoin result");
            // console.log(detectorLists);

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
                    let activeState = 0;
                    let menuItem = new CategoryItem(activeState, element.name, element.description, element.author, onClick, isSelected);

                    let categoryMenuItem = this.categories.find((cat: CategoryItem) => cat.label === element.category);
                    if (!categoryMenuItem) {
                        let categoryIcon = `https://applensassets.blob.core.windows.net/applensassets/${element.category}.png`;

                        categoryMenuItem = new CategoryItem(activeState, element.category, null, null, null, null, categoryIcon, true);
                        this.categories.push(categoryMenuItem);
                    }

                    categoryMenuItem.subItems.push(menuItem);
                }

                    // This needs to be filtered in the prod env
                    // let category = element.category ? element.category : "Uncategorized";

              
                    // let activeState = 0;
                    // let menuItem = new CategoryItem(activeState, element.name, element.description, element.author, onClick, isSelected);

                    // let categoryMenuItem = this.categories.find((cat: CategoryItem) => cat.label === category);
                    // if (!categoryMenuItem) {
                    //     let categoryIcon = `https://applensassets.blob.core.windows.net/applensassets/${category}.png`;

                    //     categoryMenuItem = new CategoryItem(activeState,category, null, null, null, null, categoryIcon, true);
                    //     this.categories.push(categoryMenuItem);
                    // }

                    // categoryMenuItem.subItems.push(menuItem);
                
            });

            this.categories = this.categories.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));
        });
    };

    getPhoto(): Observable<any> {
        return this._diagnosticService.getUserPhoto("shgup").pipe(map(image => {
            // const url = window.URL;
            // const blobUrl = url.createObjectURL(image.data);
            console.log("photo source");
            return 'data:image/jpeg;base64,' + image;
            console.log(this.userPhotoSrc);
            return this.userPhotoSrc
         //   document.getElementById("userPhoto").setAttribute("src", blobUrl);
        }));
    }

    navigateToCategory(category: CategoryItem) {
        this.navigateTo(`../categories/${category.label}`);
    }

    setActiveCategory(category: CategoryItem, selectedIndex: number) {
        // set its state to be active;
        category.activeState = 2;
        this.activeRow = Math.floor(selectedIndex / 4);
        this.categories.forEach((currentCategory, index) => {
            if (Math.floor(index / 4) == this.activeRow) {
                if (selectedIndex !== index) {
                    // set the activeState of the categories in the same row to be inactive;
                    currentCategory.activeState = 1;
                }
            }
            else {
                currentCategory.activeState = 0;
            }
        });
        this.activeCategoryName = name;
    }

    clickAction(subcategory: CategoryItem) {
        subcategory.onClick();
    }

    inActiveRow(index: number) {
        return this.activeRow === Math.floor(index / 4);
    }

    @HostListener('document:click', ['$event.target'])
    public onClick(targetElement) {
        // const clickedInside = this._elementRef.nativeElement.contains(targetElement);

        const clickedOutside = targetElement.className === "category-container" || targetElement.className === "outer-container";
        if (clickedOutside) {
            this.activeCategoryName = undefined;
            this.categories.forEach((category) => {
                category.activeState = 0;
            })
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

        //this._router.navigate(path.split('/'), navigationExtras);
        this._router.navigate([path], navigationExtras);
    }
}

export class CategoryItem {
    activeState: number = 0;
    label: string;
    description: string;
    author: string;
    onClick: Function;
    expanded: boolean = false;
    subItems: CategoryItem[];
    isSelected: Function;
    icon: string;

    constructor(activeState: number, label: string, description: string, author: string, onClick: Function, isSelected: Function, icon: string = null, expanded: boolean = false, subItems: CategoryItem[] = []) {
        this.activeState = 0;
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
