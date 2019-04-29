import { Component, OnInit } from '@angular/core';
import { CategoryItem } from '../resource-home/resource-home.component';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { DiagnosticService } from 'diagnostic-data';
import { AvatarModule } from 'ngx-avatar';

@Component({
  selector: 'category-page',
  templateUrl: './category-page.component.html',
  styleUrls: ['./category-page.component.scss']
})
export class CategoryPageComponent implements OnInit {

    categoryName: string;
    category: CategoryItem;
    categories: CategoryItem[] = []; 
    detectors: DetectorItem[] = [];   
    categoryIcon: string;
    detectorsNumber: number = 0;

    supportTopicIdMapping: any[] = [];
    supportTopicsNumber: number = 0;

    authors: any[] = [];
    authorsNumber: number = 0;

    detectorsWithSupportTopics: DetectorMetaData[];
    detectorsPublicOrWithSupportTopics: DetectorMetaData[] = [];


  constructor(private _route: Router, private _activatedRoute: ActivatedRoute, private _diagnosticService: DiagnosticService) { }

  ngOnInit() {
    this.categoryName = this._activatedRoute.snapshot.params['category'];
    this.categoryIcon = `https://applensassets.blob.core.windows.net/applensassets/${this.categoryName}.png`;
    console.log(`CategoryName: ${this.categoryName}`);

    const detectorsListWithSupportTopics = this._diagnosticService.getDetectors().pipe(map((detectors: DetectorMetaData[]) => {
        // detector.category.toLowerCase() === this.categoryName.toLowerCase() && 

        var detectorsWithSupportTopics = detectors.filter(detector => detector.category && detector.category.toLowerCase() === this.categoryName.toLowerCase() && detector.supportTopicList && detector.supportTopicList.length > 0);
        
        if (this.categoryName === "Uncategorized")
        {
            detectorsWithSupportTopics = detectors.filter(detector => !detector.category && detector.supportTopicList && detector.supportTopicList.length > 0);
        }

        detectorsWithSupportTopics.forEach(detector => {
            detector.supportTopicList.forEach(supportTopic => {
                this.supportTopicIdMapping.push({ supportTopic: supportTopic, detectorName: detector.name });
            });
        });

        return detectorsWithSupportTopics;
    }));

    const publicDetectors = this._diagnosticService.getDetectors(false).pipe(map((detectors: DetectorMetaData[]) => {
        var publicDetectorsList = detectors.filter(detector => detector.category && detector.category.toLowerCase() === this.categoryName.toLowerCase());
        if (this.categoryName === "Uncategorized")
        {
            publicDetectorsList = detectors.filter(detector => !detector.category);
        }
        return publicDetectorsList;
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
                    console.log(`navigate to ../../detectors/${element.id}`);
                    this.navigateTo(`../../detectors/${element.id}`);
                };
            
            let authorString = "Unknown";
              let detectorAuthors = [];
              let detectorSupportTopics = [];

              if (element.author !== '') {
                authorString = element.author;
                const separators = [' ', ',', ';', ':'];
                detectorAuthors = element.author.split(new RegExp(separators.join('|'), 'g'));
                console.log("**Author**");
                console.log(element.author);
                console.log(detectorAuthors);
                detectorAuthors.forEach(author => {
                  if (author && author.length > 0 && !this.authors.find(existingAuthor => existingAuthor === author)) {
                    this.authors.push(author);
                  }
                });
              }

              detectorAuthors.push("xipeng");
              detectorAuthors.push("shgup");

              if (element.supportTopicList && element.supportTopicList.length > 0)
              {
                  element.supportTopicList.forEach((supportTopic) => {
                    detectorSupportTopics.push(supportTopic);
                  });

              }

              if (!this.detectors.find(item => item.name === element.name))
              {
                let detectorItem = new DetectorItem(element.name, element.description, authorString, detectorAuthors, detectorSupportTopics, onClick);
                this.detectors.push(detectorItem);
              }

            });

        });

        this.detectorsNumber = this.detectorsPublicOrWithSupportTopics.length;
        this.supportTopicsNumber = this.supportTopicIdMapping.length;
        this.authorsNumber = this.authors.length;

        console.log(`detectors ${this.detectorsNumber}, spnum: ${this.supportTopicsNumber}, authorsNumber: ${this.authorsNumber}`);
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

navigateToHomePage() {
    this.navigateTo("../../home");
}

}

export class DetectorItem {
    name: string;
    description: string;
    authorString: string;
    authors: any[] = [];
    supportTopics: any[] = [];
    onClick: Function;

    constructor(name: string, description: string, authorString: string, authors: any[], supportTopics: any[], onClick: Function) {
        this.name = name;

        if (description == undefined || description === "")
        {
            description = "This detector doesn't have any description."
        }
        this.description = description;
        this.authorString = authorString;
        this.authors = authors;
        this.supportTopics = supportTopics;
        this.onClick = onClick;
    }
}



