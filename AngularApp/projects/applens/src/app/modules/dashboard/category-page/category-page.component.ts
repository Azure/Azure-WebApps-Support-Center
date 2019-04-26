import { Component, OnInit } from '@angular/core';
import { CategoryItem } from '../resource-home/resource-home.component';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { DiagnosticService } from 'diagnostic-data';

@Component({
  selector: 'category-page',
  templateUrl: './category-page.component.html',
  styleUrls: ['./category-page.component.scss']
})
export class CategoryPageComponent implements OnInit {

    categoryName: string;
    category: CategoryItem;
    categories: CategoryItem[] = [];

    detectorsWithSupportTopics: DetectorMetaData[];
    detectorsPublicOrWithSupportTopics: DetectorMetaData[] = [];

  constructor(private _route: Router, private _activatedRoute: ActivatedRoute, private _diagnosticService: DiagnosticService) { }

  ngOnInit() {
    this.categoryName = this._activatedRoute.snapshot.params['category'].toLowerCase();

    const detectorsListWithSupportTopics = this._diagnosticService.getDetectors().pipe(map((detectors: DetectorMetaData[]) => {
        var detectorsWithSupportTopics = detectors.filter(detector => detector.category.toLowerCase() === this.categoryName.toLowerCase() && detector.supportTopicList && detector.supportTopicList.length > 0);

        // detectorsWithSupportTopics.forEach(detector => {
        //     detector.supportTopicList.forEach(supportTopic => {
        //         this.supportTopicIdMapping.push({ supportTopic: supportTopic, detectorName: detector.name });
        //     });
        // });

        return detectorsWithSupportTopics;
    }));

    const publicDetectors = this._diagnosticService.getDetectors(false).pipe(map((detectors: DetectorMetaData[]) => {
        return detectors.filter(detector => detector.category.toLowerCase() === this.categoryName.toLowerCase());
    }));

    forkJoin(detectorsListWithSupportTopics, publicDetectors).subscribe((detectorLists) => {
        console.log("Detectors of current category");
        console.log(detectorLists);

        detectorLists.forEach((detectorList: DetectorMetaData[]) => {
            detectorList.forEach(detector => {
                if (!this.detectorsPublicOrWithSupportTopics.find((existingDetector) => existingDetector.id === detector.id)) {
                    this.detectorsPublicOrWithSupportTopics.push(detector);
                }
            });

            this.detectorsPublicOrWithSupportTopics.forEach(element => {
                let onClick = () => {
                    this.navigateTo(`../../detectors/${element.id}`);
                };

                // let isSelected = () => {
                //     return this.currentRoutePath && this.currentRoutePath.join('/') === `detectors/${element.id}`;
                // };

                let category = element.category ? element.category : "Uncategorized";
                let activeState = 0;
                let menuItem = new CategoryItem(activeState, element.name, element.description, element.author, onClick, undefined);

                let categoryMenuItem = this.categories.find((cat: CategoryItem) => cat.label === category);
                if (!categoryMenuItem) {
                    let categoryIcon = `https://applensassets.blob.core.windows.net/applensassets/${category}.png`;
                    console.log(`CategoryIcon: ${categoryIcon}`);

                    categoryMenuItem = new CategoryItem(activeState, category, null, null, null, null, categoryIcon, true);
                    this.categories.push(categoryMenuItem);
                }

                categoryMenuItem.subItems.push(menuItem);
            });

            this.categories = this.categories.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));
        });
    });
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
    this._route.navigate([path], navigationExtras);
}
}
