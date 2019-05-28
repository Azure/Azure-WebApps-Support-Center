import { Component, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { AvatarModule } from 'ngx-avatar';
import { Location } from '@angular/common';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { DetectorItem } from '../category-page/category-page.component';

@Component({
  selector: 'user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss', '../category-page/category-page.component.scss']
})
export class UserProfileComponent implements OnInit {

  userId: string = "";
  userPhotoSource: string = "";
  userInfo: UserInfo = undefined;
  businessPhones: string = "";
  detectorsOfAuthor: DetectorMetaData[] = undefined;
  detectors: DetectorItem[] = [];
  detectorsNumber: number = 0;
  isCurrentUser: boolean = false;

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute,  private _diagnosticService: ApplensDiagnosticService, private _adalService: AdalService, private _location: Location, private _supportTopicService: ApplensSupportTopicService) { }

  ngOnInit() {
    this.detectorsOfAuthor = undefined;
    this.userId = this._activatedRoute.snapshot.params['userId'];

    this._activatedRoute.params.subscribe(params => {
      this.userId = params['userId'];
      this.detectors = [];
      let alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
      let currentUser = alias.replace('@microsoft.com', '');
      this.isCurrentUser = currentUser.toLowerCase() === this.userId;

      this._diagnosticService.getUserPhoto(this.userId).subscribe(image => {
        this.userPhotoSource = image;
      });
  
      this._diagnosticService.getUserInfo(this.userId).subscribe((userInfo: UserInfo) => {
        this.userInfo = userInfo;
        this.businessPhones = userInfo.businessPhones.replace(/"/g, '').replace(']', '').replace('[', '');
      }); 
      
      this._diagnosticService.getDetectors().subscribe((detectors: DetectorMetaData[]) => {
        // Get all the detectors of the current author
        this.detectorsOfAuthor = detectors.filter(detector => detector.author && detector.author.toLowerCase().indexOf(this.userId.toLowerCase()) > -1);
  
        this.detectorsNumber = this.detectorsOfAuthor.length;
        this.detectorsOfAuthor.forEach((detector) => {
          this._supportTopicService.getCategoryImage(detector.name).subscribe((iconString) => {
            let onClick = () => {
              this.navigateTo(`../../detectors/${detector.id}`);
            };

            if (this.isCurrentUser) {
              onClick = () => {
                this.navigateTo(`../../detectors/${detector.id}/edit`);
              };
            }
  
            let detectorUsersImages: { [name: string]: string } = {};
            let detectorItem = new DetectorItem(detector.name, detector.description, iconString, detector.author, [], detectorUsersImages, [], onClick);
            this.detectors.push(detectorItem);
  
          });
        });
      });   
  });
  }

  navigateBack() {
    this._location.back();
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

export class UserInfo {
  businessPhones: string;
  displayName: string;
  givenName: string;
  jobTitle: string;
  mail: string;
  officeLocation: string;
  userPrincipalName: string;
}
