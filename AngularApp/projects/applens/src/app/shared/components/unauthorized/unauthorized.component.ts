import {Component, OnInit} from '@angular/core';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';
import { Router } from '@angular/router';

const postAuthRedirectKey = 'post_auth_redirect';

@Component({
    selector: 'app-unauthorized',
    templateUrl: './unauthorized.component.html',
    styleUrls: ['./unauthorized.component.scss']
  })
export class UnauthorizedComponent implements OnInit {
    temporaryAccessFailed: boolean = false;
    accessFailedReason: string = "";
    temporaryAccessSucceeded: boolean = false;
    temporaryAccessSuccessMessage: string = "";

    public constructor(private _router: Router, private _diagnosticApiService: DiagnosticApiService){
      
    }
    ngOnInit(){
    }

    navigateToRedirectUrl(){
      var returnUrl = localStorage.getItem(postAuthRedirectKey);
      if (returnUrl && returnUrl != '') {
          this._router.navigateByUrl(returnUrl);
          localStorage.removeItem(postAuthRedirectKey);
      }
      else{
          this._router.navigateByUrl('/');
      }
    }

    requestTemporaryAccess(){
      this._diagnosticApiService.requestTemporaryAccess().subscribe(res => {
        this.temporaryAccessSuccessMessage = res;
        this.temporaryAccessSucceeded = true;
        setTimeout(() => {
          this.navigateToRedirectUrl();
        }, 2000);
      },
      (err) => {
        this.temporaryAccessFailed = true;
        this.accessFailedReason = err.error;
      });
    }
}