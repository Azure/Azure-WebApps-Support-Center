import { Component, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Router, ActivatedRoute } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { AvatarModule } from 'ngx-avatar';
import { Location } from '@angular/common';

@Component({
  selector: 'user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  userId: string = "";
  userPhotoSource: string = "";
  userInfo: UserInfo = undefined;
  businessPhones: string = "";
  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService, private _adalService: AdalService, private _location: Location) { }

  ngOnInit() {
    this._activatedRoute.params.subscribe(routeParams => {
      this.userId = routeParams.userId;

      this._diagnosticService.getUserPhoto(this.userId).subscribe(image => {
        this.userPhotoSource = image;
      });

      this._diagnosticService.getUserInfo(this.userId).subscribe((userInfo: UserInfo) => {
        this.userInfo = userInfo;
        this.businessPhones = userInfo.businessPhones.replace(/"/g, '').replace(']', '').replace('[', '');
      });
    });
  }

  navigateBack() {
    this._location.back();
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
