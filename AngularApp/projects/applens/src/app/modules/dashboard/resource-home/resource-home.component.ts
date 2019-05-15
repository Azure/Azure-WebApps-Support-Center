import { Component, OnInit, Output, ElementRef, HostListener, EventEmitter } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { DetectorMetaData } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'resource-home',
    templateUrl: './resource-home.component.html',
    styleUrls: ['./resource-home.component.scss']
})
export class ResourceHomeComponent implements OnInit {

    currentRoutePath: string[];
    categories: CategoryItem[]=[];
    resource: any;
    keys: string[];
    activeCategoryName: string = undefined;
    activeRow: number = undefined;

    authorsList: string[] = [];
    detectorsWithSupportTopics: DetectorMetaData[];
    detectorsPublicOrWithSupportTopics: DetectorMetaData[] = [];

    supportTopics: SupportTopicItem[]=[];

    viewType: string = 'category';


    constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _http: HttpClient, private _resourceService: ResourceService, private _diagnosticService: ApplensDiagnosticService, private _supportTopicService: ApplensSupportTopicService) { }

    ngOnInit() {
        this.viewType = this._activatedRoute.snapshot.params['viewType'];
        this._resourceService.getCurrentResource().subscribe(resource => {
            if (resource) {
                this.resource = resource;
                this.keys = Object.keys(this.resource);
            }
        });

        this._diagnosticService.getSelfHelpContent().subscribe((res) => {
            console.log(res);
        })

        this._supportTopicService.getSupportTopics().subscribe((supportTopics: SupportTopicResult[]) => {
            supportTopics.forEach((supportTopic) => {
                if (supportTopic.supportTopicL2Name)
                {
                    let item = new SupportTopicItem(supportTopic.supportTopicL2Name, supportTopic.supportTopicId, supportTopic.supportTopicL3Name, supportTopic.supportTopicPath);

                    let suppportTopicItem = this.supportTopics.find((sup: SupportTopicItem) => supportTopic.supportTopicL2Name === sup.supportTopicL2Name);
                    if (!suppportTopicItem) {
                        let supportTopicIcon = `https://applensassets.blob.core.windows.net/applensassets/${supportTopic.supportTopicL2Name}.png`;
                        //let supportTopicIcon = "";
                        suppportTopicItem = new SupportTopicItem(supportTopic.supportTopicL2Name, supportTopic.supportTopicId, null, null, supportTopicIcon);
                        this.supportTopics.push(suppportTopicItem);
                    }

                    suppportTopicItem.subItems.push(item);
                }



//                 productId: "14748"
// productName: "Web App (Windows)"
// supportTopicId: "32581610"
// supportTopicL2Name: "Problems with WebJobs"
// supportTopicL3Name: "Cannot create WebJobs"
// supportTopicPath: "Web App (Windows)/Problems with WebJobs/Cannot create WebJobs"


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
        });
    };

    navigateToCategory(category: CategoryItem) {
        this.navigateTo(`../../categories/${category.label}`);
    }

    navigateToSupportTopic(supportTopic: SupportTopicItem) {
        this.navigateTo(`../../supportTopics/${supportTopic.supportTopicL2Name}`);
    }

    private loadIcon(supportTopic: SupportTopicItem) {
        this._http.get(`assets/img/${supportTopic.supportTopicL2Name}.png`).subscribe((res) => {
            supportTopic.icon = `assets/img/${supportTopic.supportTopicL2Name}.png`;
        }, (err) => {
          // HANDLE file not found
          if (err.status === 404) {
            supportTopic.icon = `https://applensassets.blob.core.windows.net/applensassets/${supportTopic.supportTopicL2Name}.png`;
          }
        });
      }

    //   private loadSecondFile() {
    //     this._http.get('/asset/second.json').subscribe(() => {
    //       // HANDLE file found
    //     }, () => {
    //       // HANDLE file not found

    //     });
    //   }

    // getSupportTopicImage(supportTopicL2Name: string):Observable<any>{
    //     // this._http.get('assets/{supportTopicL2Name}.json').subscribe(jsonResponse =>{
    //     //     this.enabledResourceTypes = <ResourceServiceInputs[]>jsonResponse.enabledResourceTypes;
    //     //   });

    //      return this._http.head(`assets/${supportTopicL2Name}.png`,{ observe: 'response', responseType: 'blob' })
    //       .pipe(
    //         map(response => {
    //           return of(`assets/${supportTopicL2Name}.png`);

    //         }),
    //         catchError(error => {
    //           return of(`https://applensassets.blob.core.windows.net/applensassets/${supportTopicL2Name}.png`);
    //         })
    //       );
    //     }

        //   .map((response) => response.status)
        //   .catch((error) => Observable.of(error.status || 404))
        //   .subscribe((status) => console.log(`status = ${status}`));


    //     this.http.head("/some-file.txt")
    // .map((response) => response.status)
    // .catch((error) => Observable.of(error.status || 404))
    // .subscribe((status) => console.log(`status = ${status}`));


    navigateTo(path: string) {
        let navigationExtras: NavigationExtras = {
            queryParamsHandling: 'preserve',
            preserveFragment: true,
            relativeTo: this._activatedRoute
        };

        this._router.navigate([path], navigationExtras);
    }

    selectView(type: string) {
        this.viewType = type;
        this.navigateTo(`../${type}/`);
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


export class SupportTopicResult {
    productId: string;
    supportTopicId: string;
    productName: string;
    supportTopicL2Name: string;
    supportTopicL3Name: string;
    supportTopicPath: string;
}

export class SupportTopicItem {
    supportTopicL2Name: string;
    subItems: SupportTopicItem[];
    supportTopicId: string;
    supportTopicL3Name: string;
    supportTopicPath: string;
    // onClick: Function;
    // isSelected: Function;
    icon: string;
    detectorId: string;
    detectorName: string;
    detectorInternal: boolean;

    constructor(supportTopicL2Name: string, supportTopicId: string, supportTopicL3Name: string, supportTopicPath: string, icon: string = "", subItems: SupportTopicItem[]=[], detectorId: string = "", detectorName:string = "", detectorInternal:boolean = true) {
        this.supportTopicL2Name = supportTopicL2Name;
        this.subItems = subItems;
        this.supportTopicId = supportTopicId;
        this.supportTopicL3Name = supportTopicL3Name;
        this.supportTopicPath = supportTopicPath;
        // this.onClick = onClick;
        // this.isSelected = isSelected;
        this.icon = icon;
        this.detectorId = detectorId;
        this.detectorName = detectorName;
        this.detectorInternal = detectorInternal;
    }
}
