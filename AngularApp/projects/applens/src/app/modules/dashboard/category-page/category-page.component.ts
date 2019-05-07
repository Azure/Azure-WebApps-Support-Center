import { Component, OnInit } from '@angular/core';
import { CategoryItem } from '../resource-home/resource-home.component';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { DiagnosticService } from 'diagnostic-data';
import { AvatarModule } from 'ngx-avatar';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';


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
    authorsList: string[] = [];
    authorsNumber: number = 0;
    userImages: { [name: string]: string };

    detectorsWithSupportTopics: DetectorMetaData[];
    detectorsPublicOrWithSupportTopics: DetectorMetaData[] = [];


    constructor(private _route: Router, private _activatedRoute: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService) { }

    ngOnInit() {
        this.categoryName = this._activatedRoute.snapshot.params['category'];
        this.categoryIcon = `https://applensassets.blob.core.windows.net/applensassets/${this.categoryName}.png`;

        const allDetectors = this._diagnosticService.getDetectors();
        const detectorsListWithSupportTopics = this._diagnosticService.getDetectors().pipe(map((detectors: DetectorMetaData[]) => {

            let authorString = "";
            detectors.forEach(detector => {
                if (detector.author != undefined && detector.author !== '') {
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


            // This seems
            var body = {
                authors: this.authorsList
            };

            this._diagnosticService.getUsers(body).subscribe((userImages) => {
                this.userImages = userImages;

                console.log("*** All the users json images");
                console.log(this.userImages);
                //   let jsonusers = JSON.parse(userImages);
                //   console.log(jsonusers);
                //   console.log(jsonusers["jebrook"]);
            });;



            var detectorsWithSupportTopics = detectors.filter(detector => detector.category && detector.category.toLowerCase() === this.categoryName.toLowerCase() && detector.supportTopicList && detector.supportTopicList.length > 0);

            if (this.categoryName === "Uncategorized") {
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
            if (this.categoryName === "Uncategorized") {
                publicDetectorsList = detectors.filter(detector => !detector.category);
            }
            return publicDetectorsList;
        }));

        forkJoin(detectorsListWithSupportTopics, publicDetectors).subscribe((detectorLists) => {
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

                    let authorString = "Unknown";
                    let detectorAuthors = [];
                    let detectorUsersImages: { [name: string]: string };
                    let detectorSupportTopics = [];

                    if (element.author != undefined) {
                        authorString = element.author;
                        const separators = [' ', ',', ';', ':'];
                        detectorAuthors = element.author.split(new RegExp(separators.join('|'), 'g'));

                        detectorAuthors.forEach(author => {
                            if (author && author.length > 0 && !this.authors.find(existingAuthor => existingAuthor === author)) {
                                this.authors.push(author);
                            }

                            console.log("**********");
                            console.log(author);
                            console.log(this.userImages.hasOwnProperty(String(author)));
                            console.log(this.userImages[String(author)]);
                            console.log("**********");
                            detectorUsersImages[author] = this.userImages.hasOwnProperty(author) ? this.userImages[author] : undefined;
                            console.log(detectorUsersImages[author]);
                            //   detectorUsersImages.push(this.userImages["v-jelu"]);
                        });
                    }


                    // if (this.userImages.hasOwnProperty(id)) {
                    //     properties[id] = String(this.eventPropertiesLocalCopy[id]);
                    // }

                //     detectorUsersImages['jebrook'] = String(this.userImages.jebrook);
                // //    detectorUsersImages["v-jelu"] = this.userImages["v-jelu"];

                //     console.log("**Detector user images**");
                //     console.log(detectorUsersImages);

                    if (element.supportTopicList && element.supportTopicList.length > 0) {
                        element.supportTopicList.forEach((supportTopic) => {
                            detectorSupportTopics.push(supportTopic);
                        });

                    }


                    if (!this.detectors.find(item => item.name === element.name)) {
                        let detectorItem = new DetectorItem(element.name, element.description, authorString, detectorAuthors, detectorUsersImages, detectorSupportTopics, onClick);
                        this.detectors.push(detectorItem);
                    }

                });

            });

            this.detectorsNumber = this.detectorsPublicOrWithSupportTopics.length;
            this.supportTopicsNumber = this.supportTopicIdMapping.length;
            this.authorsNumber = this.authors.length;

            let authorString = "";
            this.detectors.forEach(detector => {
                if (detector.authorString != undefined && detector.authorString !== '') {
                    authorString = authorString + "," + detector.authorString;
                }
            });

            console.log("Detectors: and authors");
            console.log(this.detectors);
            console.log(this.authors);


            // this.authorsList.push("patbut");
            // this.authorsList.push("shgup");

            // console.log("*** All the authors");
            // console.log(this.authorsList);

            // console.log(`detectors ${this.detectorsNumber}, spnum: ${this.supportTopicsNumber}, authorsNumber: ${this.authorsNumber}`);
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
    userImages: any;
    supportTopics: any[] = [];
    onClick: Function;

    constructor(name: string, description: string, authorString: string, authors: any[], userImages: any, supportTopics: any[], onClick: Function) {
        this.name = name;

        if (description == undefined || description === "") {
            description = "This detector doesn't have any description."
        }
        this.description = description;
        this.authorString = authorString;
        this.authors = authors;
        this.userImages = userImages;
        this.supportTopics = supportTopics;
        this.onClick = onClick;
    }
}



