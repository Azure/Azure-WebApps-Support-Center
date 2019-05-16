import { Component, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Router, ActivatedRoute } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { AvatarModule } from 'ngx-avatar';

@Component({
  selector: 'user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  userId: string="";
  userPhotoSource: string="";
  userInfo: UserInfo=undefined;
  businessPhones: string="";
  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService, private _adalService: AdalService) { }

  ngOnInit() {
    this.userId = this._activatedRoute.snapshot.params['userId'];

    let alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';

    this._diagnosticService.getUserPhoto(this.userId).subscribe(image => {
        this.userPhotoSource = image;
    });

    this._diagnosticService.getUserInfo(this.userId).subscribe((userInfo: UserInfo) => {
      this.userInfo = userInfo;
      this.businessPhones = userInfo.businessPhones.replace(/"/g, '').replace(']', '').replace('[', '');
      console.log(this.businessPhones);
    });

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
