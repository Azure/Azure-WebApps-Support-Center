import { Component, OnInit, Output, ElementRef, HostListener, EventEmitter } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { DetectorMetaData } from 'diagnostic-data';
import { forkJoin, Observable, of } from 'rxjs';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { CacheService } from '../../../shared/services/cache.service';
import { HttpClient } from '@angular/common/http';
import { catchError, mergeMap, retry, map, retryWhen, delay, take, concat } from 'rxjs/operators';



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

    supportTopics: SupportTopicItem[] = [];
    supportTopicL2Images: { [name: string]: any } = {};
    viewType: string = 'category';


    constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _http: HttpClient, private _resourceService: ResourceService, private _diagnosticService: ApplensDiagnosticService, private _supportTopicService: ApplensSupportTopicService, private _cacheService: CacheService) { }

    ngOnInit() {
        this.viewType = this._activatedRoute.snapshot.params['viewType'];
        this._resourceService.getCurrentResource().subscribe(resource => {
            if (resource) {
                this.resource = resource;
                this.keys = Object.keys(this.resource);
            }
        });

        // return this.ocpApimKeyBehaviorSubject.pipe(
        //     mergeMap((key:string)=>{
        //       return this._http.get(url, { headers: this.getWebSearchHeaders() }).pipe(map(response => response.json()));
        //     })
        //   );



    // getSupportTopicImage1(supportTopicL2Name: string):Observable<any>{
    //     // this._http.get('assets/{supportTopicL2Name}.json').subscribe(jsonResponse =>{
    //     //     this.enabledResourceTypes = <ResourceServiceInputs[]>jsonResponse.enabledResourceTypes;
    //     //   });

    //     return this._http.head(`assets/img/${supportTopicL2Name}.png`,{ observe: 'response', responseType: 'blob' }).pipe(
    //         map(response => {
    //             console.log("Get image from assets");
    //           return of(`assets/img/${supportTopicL2Name}.png`);
    //         }),
    //         catchError(error => {
    //             console.log("Get image from blob");
    //             console.log(error);
    //             return of(`https://applensassets.blob.core.windows.net/applensassets/${supportTopicL2Name}.png`);
    //         })
    //       );


    // return this._diagnosticService.getDetectors().pipe(
    //     mergeMap((detectors: DetectorMetaData[]) => {
    //       const subDetectors: string[] = [];
    //       detectorList.forEach(childSet => (<DetectorListRendering>childSet.renderingProperties).detectorIds.forEach(detector => subDetectors.push(detector)));

    //       this.detectorSummaryViewModels = detectors.filter(detector => subDetectors.indexOf(detector.id) != -1).map(detector => {
    //         return <DetectorSummaryViewModel>{
    //           id: detector.id,
    //           loading: LoadingStatus.Loading,
    //           name: detector.name,
    //           path: `detectors/${detector.id}`,
    //           status: null,
    //           type: DetectorSummaryType.ChildDetector
    //         };
    //       });

    //       this.loading = false;

    //       const tasks = this.detectorSummaryViewModels.map(detector => {
    //         return this._diagnosticService.getDetector(detector.id, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString).pipe(
    //           map(response => {
    //             detector.status = response.status.statusId;
    //             detector.loading = LoadingStatus.Success;
    //         }));
    //       });

    //       return forkJoin(tasks);
    //     })
    //   );

    // this._authService.getStartupInfo()
    // .subscribe((startUpInfo: StartupInfo) => {
    //     if (startUpInfo.resourceType === ResourceType.Site) {
    //         this._armService.getResource<Site>(startUpInfo.resourceId).pipe(
    //             mergeMap((site: ResponseMessageEnvelope<Site>) => {
    //                 this.currentSite = site.properties;
    //                 return this._rbacService.hasPermission(this.currentSite.serverFarmId, [this._rbacService.readScope]);
    //             }))
    //             .subscribe((hasPermission: boolean) => {
    //                 this.hasReadAccessToServerFarm = hasPermission;
    //                 //disable for Linux

    //                 if (SiteExtensions.operatingSystem(this.currentSite) === OperatingSystem.windows) {
    //                     this.initialize();
    //                 }
    //             });
    //     }
    // });

    this._supportTopicService.getSupportTopics().subscribe((supportTopics: SupportTopicResult[]) => {
        supportTopics.forEach((supportTopic) => {
            let supportTopicL2Name = supportTopic.supportTopicL2Name;
            this._supportTopicService.getCategoryImage(supportTopicL2Name).subscribe((iconString) => {
                this.supportTopicL2Images[supportTopicL2Name] = iconString;
                let item = new SupportTopicItem(supportTopic.supportTopicL2Name, supportTopic.productId, supportTopic.supportTopicId, supportTopic.supportTopicL3Name, supportTopic.supportTopicPath);
                let suppportTopicItem = this.supportTopics.find((sup: SupportTopicItem) => supportTopic.supportTopicL2Name === sup.supportTopicL2Name);

                if (!suppportTopicItem) {
                    suppportTopicItem = new SupportTopicItem(supportTopic.supportTopicL2Name, supportTopic.productId, supportTopic.supportTopicId, null, null, iconString);
                    console.log("image source");
                    console.log(suppportTopicItem);
                    this.supportTopics.push(suppportTopicItem);
                }

                suppportTopicItem.subItems.push(item);

            });
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


                let categoryName = element.category;
                if (categoryName) {


            this._supportTopicService.getCategoryImage(categoryName).subscribe((iconString) => {
                let menuItem = new CategoryItem(element.name, element.description, element.author, onClick, isSelected);
                let categoryMenuItem = this.categories.find((cat: CategoryItem) => cat.label === element.category);

                if (!categoryMenuItem) {

                    categoryMenuItem = new CategoryItem(element.category, null, null, null, null, iconString);

                    this.categories.push(categoryMenuItem);
                }

                categoryMenuItem.subItems.push(menuItem);

            });
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

    // private loadIcon(supportTopicL2Name: string): Observable<string> {
    //     return this._http.get(`assets/img/${supportTopicL2Name}.png`).subscribe(
    //         (res) => {
    //             return `assets/img/${supportTopicL2Name}.png`;
    //         },
    //         (err) => {
    //             // HANDLE file not found
    //             return `https://applensassets.blob.core.windows.net/applensassets/${supportTopicL2Name}.png`;
    //         });
    // }

    //   private loadSecondFile() {
    //     this._http.get('/asset/second.json').subscribe(() => {
    //       // HANDLE file found
    //     }, () => {
    //       // HANDLE file not found

    //     });
    //   }






    getSupportTopicImage1(supportTopicL2Name: string):Observable<any>{
        // this._http.get('assets/{supportTopicL2Name}.json').subscribe(jsonResponse =>{
        //     this.enabledResourceTypes = <ResourceServiceInputs[]>jsonResponse.enabledResourceTypes;
        //   });

        return this._http.head(`assets/img/${supportTopicL2Name}.png`,{ observe: 'response', responseType: 'blob' });

        //  return this._http.head(`assets/img/${supportTopicL2Name}.png`,{ observe: 'response', responseType: 'blob' })
        //   .pipe(
        //     map(response => {
        //         console.log("Get image from assets");
        //       return of(`assets/img/${supportTopicL2Name}.png`);
        //     }),
        //     catchError(error => {
        //         console.log("Get image from blob");
        //         console.log(error);
        //       return of(`https://applensassets.blob.core.windows.net/applensassets/${supportTopicL2Name}.png`);
        //     })
        //   );
        }

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
    pesId: string;
    supportTopicId: string;
    supportTopicL3Name: string;
    supportTopicPath: string;
    icon: string;
    detectorId: string;
    detectorName: string;
    detectorInternal: boolean;

    constructor(supportTopicL2Name: string, pesId: string, supportTopicId: string, supportTopicL3Name: string, supportTopicPath: string, icon: string = "", subItems: SupportTopicItem[] = [], detectorId: string = "", detectorName: string = "", detectorInternal: boolean = true) {
        this.supportTopicL2Name = supportTopicL2Name;
        this.subItems = subItems;
        this.pesId = pesId;
        this.supportTopicId = supportTopicId;
        this.supportTopicL3Name = supportTopicL3Name;
        this.supportTopicPath = supportTopicPath;
        this.icon = icon;
        this.detectorId = detectorId;
        this.detectorName = detectorName;
        this.detectorInternal = detectorInternal;
    }
}
