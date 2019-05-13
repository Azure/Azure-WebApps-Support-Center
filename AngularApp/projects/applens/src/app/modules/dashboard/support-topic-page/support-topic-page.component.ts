import { Component, OnInit } from '@angular/core';
import { SupportTopicItem, SupportTopicResult } from '../resource-home/resource-home.component';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { AvatarModule } from 'ngx-avatar';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { HttpClient } from '@angular/common/http';
import { ResourceService } from '../../../shared/services/resource.service';

@Component({
  selector: 'support-topic-page',
  templateUrl: './support-topic-page.component.html',
  styleUrls: ['../category-page/category-page.component.scss']
})

export class SupportTopicPageComponent implements OnInit {

    pesId: string;
    supportTopicId: string;
    supportTopicName: string;
    supportTopic: SupportTopicItem;
    supportTopics: SupportTopicItem[] = [];
    detectors: DetectorItem[] = [];
    supportTopicIcon: string;
    supportTopicsNumber: number=0;
    detectorsNumber: number=0;

    allDetectors: DetectorMetaData[] = [];
    detectorsWithSupportTopics: DetectorMetaData[] = [];
    publicDetectorsList: DetectorMetaData[] = [];
    filterdDetectors: DetectorMetaData[] = [];
    filterdDetectorAuthors: string[] = [];
    supportTopicIdMapping: any[] = [];

    authors: any[] = [];
    authorsList: string[] = [];
    authorsNumber: number = 0;
    userImages: { [name: string]: string };

    detectorsPublicOrWithSupportTopics: DetectorMetaData[] = [];


    constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _http: HttpClient, private _resourceService: ResourceService, private _diagnosticService: ApplensDiagnosticService, private _supportTopicService: ApplensSupportTopicService) { }

    ngOnInit() {
        this.supportTopicName = this._activatedRoute.snapshot.params['supportTopic'];
        this.supportTopicIcon = `https://applensassets.blob.core.windows.net/applensassets/${this.supportTopicName}.png`;

        this.pesId = this._supportTopicService.getPesId();
        this._diagnosticService.getDetectors().subscribe((detectors: DetectorMetaData[]) => {
          this.detectorsWithSupportTopics = detectors.filter(detector => detector.supportTopicList && detector.supportTopicList.length > 0);
          
          this.detectorsWithSupportTopics.forEach(detector => {
            detector.supportTopicList.forEach(supportTopic => {
              if (supportTopic.pesId === this.pesId)
              {
                this.supportTopicIdMapping.push({ supportTopic : supportTopic, detectorId: detector.id, detectorName: detector.name, detectorInternal:true });
              }
            });
          });

          this._supportTopicService.getSupportTopics().subscribe((allSupportTopics: SupportTopicResult[]) => {
            let filteredSupportTopics = allSupportTopics.filter((supportTopic) => supportTopic.supportTopicL2Name === this.supportTopicName);
            
            filteredSupportTopics.forEach((sup: SupportTopicResult) => {
              let icon = `https://applensassets.blob.core.windows.net/applensassets/${sup.supportTopicL3Name}.png`;
              let matchingDetector = this.supportTopicIdMapping.find((st) => st.supportTopic.id === sup.supportTopicId);
              let matchingDetectorId = "";
              let matchingDetectorName = "";
              let matchingDetectorInternalOnly = true;
              if (matchingDetector != undefined)
              {
                matchingDetectorId =matchingDetector.detectorId;
                matchingDetectorName = matchingDetector.detectorName;
                matchingDetectorInternalOnly = true;
                this.detectorsNumber++;
              }

              let item = new SupportTopicItem(sup.supportTopicL2Name, sup.supportTopicId, sup.supportTopicL3Name, sup.supportTopicPath, icon, [], matchingDetectorId, matchingDetectorName, matchingDetectorInternalOnly);
              if (!this.supportTopics.find((st => st.supportTopicL3Name === sup.supportTopicL3Name)))
              {
                this.supportTopics.push(item);
              }
            });

            console.log(`Filtered`);
            console.log(filteredSupportTopics);
  
        });

                    
        console.log("Support topic id mapping");
        console.log(this.supportTopicIdMapping);

        console.log(`Support Toipcs of ${this.supportTopicName}`);
        console.log(this.supportTopics);
          this.supportTopicsNumber = this.supportTopics.length;
          return this.detectorsWithSupportTopics;
        });




        // Observable to get all the detectors
        // const allDetectorsList = this._diagnosticService.getDetectors().pipe(map((detectors: DetectorMetaData[]) => {
        //     this.allDetectors = detectors;
        //     // Get all the detectors with support topics
        //     var detectorsWithSupportTopics = detectors.filter(detector => detector.supportTopicList && detector.supportTopicList.length > 0);

        //     detectorsWithSupportTopics.forEach(detector => {
        //         console.log(`Add detectors with support topics ${detector.id}`);
        //         this.detectorsWithSupportTopics.push(detector);
        //         detector.supportTopicList.forEach(supportTopic => {
        //             this.supportTopicIdMapping.push({ supportTopic: supportTopic, detectorName: detector.name });
        //         });
        //     });


        //     // This is to get the full detectors authors list, and make graph API call
        //     let authorString = "";
        //     detectors.forEach(detector => {
        //         if (detector.author != undefined && detector.author !== '') {
        //             authorString = authorString + "," + detector.author;
        //         }
        //     });

        //     const separators = [' ', ',', ';', ':'];
        //     let authors = authorString.toLowerCase().split(new RegExp(separators.join('|'), 'g'));
        //     authors.forEach(author => {
        //         if (author && author.length > 0 && !this.authorsList.find(existingAuthor => existingAuthor === author)) {
        //             this.authorsList.push(author);
        //         }
        //     });
        // }));

        // // Observable to get all the public detectors
        // const publicDetectors = this._diagnosticService.getDetectors(false).pipe(map((publicDetectors: DetectorMetaData[]) => {
        //     this.publicDetectorsList = publicDetectors.filter(detector => detector.category && detector.category.toLowerCase() === this.categoryName.toLowerCase());
        // }));

        // forkJoin(allDetectorsList, publicDetectors).subscribe((res) => {
        //     this.detectorsWithSupportTopics.forEach((detector) => {
        //         if (!this.filterdDetectors.find((d) => d.id === detector.id)) {
        //             this.filterdDetectors.push(detector);
        //         }
        //     })

        //     // For the public detectors, since there is no PII returned from the backend. Get the detector metadata from the full list with public detector id.
        //     this.publicDetectorsList.forEach((detector) => {
        //         var detectorId = detector.id;
        //         var publicDetectorWithPII = this.allDetectors.find((detectorWithPII) => detectorWithPII.id === detectorId);
        //         if (publicDetectorWithPII && !this.filterdDetectors.find((d) => d.id === detectorId)) {
        //             this.filterdDetectors.push(publicDetectorWithPII);
        //         }
        //     });


        //     // This seems should be executed after forkjoin
        //     var body = {
        //         authors: this.authorsList
        //     };

        //     if (res[1] !== null) {
        //         this._diagnosticService.getUsers(body).subscribe((userImages) => {

        //             this.userImages = userImages;

        //             console.log("*** All the users json images");
        //             console.log(this.userImages);

        //             this.filterdDetectors.forEach((detector) => {
        //                 let onClick = () => {
        //                     this.navigateTo(`../../detectors/${detector.id}`);
        //                 };

        //                 let detectorUsersImages: { [name: string]: string } = {};

        //                 if (detector.author != undefined) {
        //                     let authors = detector.author.toLowerCase();
        //                     const separators = [' ', ',', ';', ':'];
        //                     let detectorAuthors = authors.split(new RegExp(separators.join('|'), 'g'));

        //                     detectorAuthors.forEach(author => {
        //                         if (!this.filterdDetectorAuthors.find(existingAuthor=> existingAuthor === author))
        //                         {
        //                             this.filterdDetectorAuthors.push(author);
        //                         }
        //                         detectorUsersImages[author] = this.userImages.hasOwnProperty(author) ? this.userImages[author] : undefined;
        //                     });
        //                 }

        //                 console.log(`${detector.id}: Detector user images`);
        //                 console.log(detectorUsersImages);

        //                 let detectorSupportTopics = [];
        //                 if (detector.supportTopicList && detector.supportTopicList.length > 0) {
        //                     detector.supportTopicList.forEach((supportTopic) => {
        //                         detectorSupportTopics.push(supportTopic);
        //                     });

        //                 }

        //                 let detectorItem = new DetectorItem(detector.name, detector.description, detector.author, [], detectorUsersImages, detectorSupportTopics, onClick);
        //                 this.detectors.push(detectorItem);
        //             });

        //             this.authorsNumber = this.filterdDetectorAuthors.length;
        //             this.detectorsNumber = this.filterdDetectors.length;
        //             this.supportTopicsNumber = this.supportTopicIdMapping.length;
        //         });
        //     }

        // });
    }

    navigateTo(path: string) {
        let navigationExtras: NavigationExtras = {
            queryParamsHandling: 'preserve',
            preserveFragment: true,
            relativeTo: this._activatedRoute
        };

        console.log("navigation params");
        console.log(navigationExtras);
        console.log(path);
        //this._router.navigate(path.split('/'), navigationExtras);
        this._router.navigate([path], navigationExtras);
    }

    navigateToHomePage() {
        this.navigateTo("../../home");
    }


    navigateToContent(supportTopic: SupportTopicItem) {
      if (supportTopic.detectorId != undefined && supportTopic.detectorId !== "")
      {
        console.log(`Navigating to : ../../detectors/${supportTopic.detectorId}`);
        this.navigateTo(`../../detectors/${supportTopic.detectorId}`);
      }
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



