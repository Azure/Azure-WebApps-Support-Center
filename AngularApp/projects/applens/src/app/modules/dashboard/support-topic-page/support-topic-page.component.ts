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

              let item = new SupportTopicItem(sup.supportTopicL2Name, sup.productId, sup.supportTopicId, sup.supportTopicL3Name, sup.supportTopicPath, icon, [], matchingDetectorId, matchingDetectorName, matchingDetectorInternalOnly);
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
        this.navigateTo("../../home/supportTopic");
    }


    navigateToContent(supportTopic: SupportTopicItem) {
      if (supportTopic.detectorId != undefined && supportTopic.detectorId !== "")
      {
        console.log(`Navigating to : ../../detectors/${supportTopic.detectorId}`);
        this.navigateTo(`../../detectors/${supportTopic.detectorId}`);
      }
      else {
        this.navigateTo(`../../pesId/${supportTopic.pesId}/supportTopics/${supportTopic.supportTopicId}`);
      //   this._diagnosticService.getSelfHelpContent("").subscribe((res) => {
      //     console.log(res);
      // })
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



