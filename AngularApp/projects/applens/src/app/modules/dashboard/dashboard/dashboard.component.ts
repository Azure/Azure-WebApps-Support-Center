import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import * as momentNs from 'moment';
import { DetectorControlService, FeatureNavigationService, DetectorMetaData, DetectorType } from 'diagnostic-data';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { UserInfo } from '../user-profile/user-profile.component';
import { StartupService } from '../../../shared/services/startup.service';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnDestroy {
  startTime: momentNs.Moment;
  endTime: momentNs.Moment;

  contentHeight: string;

  navigateSub: Subscription;
  userId: string = "";
  userName: string = "";
  displayName: string="";
  userPhotoSource: string = undefined;

  currentRoutePath: string[];
  resource: any;
  resourceName: string="";
  keys: string[];
  observerLink: string="";


  constructor(public resourceService: ResourceService, private _detectorControlService: DetectorControlService,
    private _router: Router, private _activatedRoute: ActivatedRoute, private _navigator: FeatureNavigationService,
    private _diagnosticService: ApplensDiagnosticService, private _adalService: AdalService, public ngxSmartModalService: NgxSmartModalService, private startupService: StartupService) {
    this.contentHeight = (window.innerHeight - 50) + 'px';

    this.navigateSub = this._navigator.OnDetectorNavigate.subscribe((detector: string) => {
      if (detector) {
        this._router.navigate([`./detectors/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });

        this._diagnosticService.getDetectors().subscribe(detectors => {
          let detectorMetaData: DetectorMetaData = detectors.find(d => d.id.toLowerCase() === detector.toLowerCase());
          if (detectorMetaData) {
            if (detectorMetaData.type === DetectorType.Detector) {
              this._router.navigate([`./detectors/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
            } else if (detectorMetaData.type === DetectorType.Analysis) {
              this._router.navigate([`./analysis/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
            }
          }
        });
      }
    });

    // Add time params to route if not already present
    if (!this._activatedRoute.queryParams['startTime'] || !this._activatedRoute.queryParams['endTime']) {
      let routeParams = {
        'startTime': this._detectorControlService.startTime.format('YYYY-MM-DDTHH:mm'),
        'endTime': this._detectorControlService.endTime.format('YYYY-MM-DDTHH:mm')
      }
      // If browser URL contains detectorQueryParams, adding it to route
      if (!this._activatedRoute.queryParams['detectorQueryParams']) {
        routeParams['detectorQueryParams'] = this._activatedRoute.snapshot.queryParams['detectorQueryParams'];
      }
      this._router.navigate([], { queryParams: routeParams, relativeTo: this._activatedRoute });
    }

    let alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    this.userId = alias.replace('@microsoft.com', '');
    this._diagnosticService.getUserPhoto(this.userId).subscribe(image => {
      this.userPhotoSource = image;
    });

    this._diagnosticService.getUserInfo(this.userId).subscribe((userInfo: UserInfo) => {
      this.userName = userInfo.givenName;
      this.displayName = userInfo.displayName;
    });
  }

  ngOnInit() {
    let serviceInputs = this.startupService.getInputs();

    this.resourceName = this.getFormattedResourceName();
    this.resourceService.getCurrentResource().subscribe(resource => {
      if (resource) {
        this.resource = resource;

        if (serviceInputs.resourceType.toString() === 'Microsoft.Web/hostingEnvironments' && this.resource && this.resource.Name)
        {
            this.observerLink = "https://wawsobserver.azurewebsites.windows.net/MiniEnvironments/"+ this.resource.Name;
        }
        else if (serviceInputs.resourceType.toString() === 'Microsoft.Web/sites')
        {
            this.observerLink = "https://wawsobserver.azurewebsites.windows.net/sites/"+ this.resource.SiteName;
        }

        this.keys = Object.keys(this.resource);
      }
    });
  }

  getFormattedResourceName(): string {
      let resourceName = this.resourceService.getResourceName();
      if (resourceName && resourceName.length >= 35)
      {
          resourceName = resourceName.substring(0, 35).concat("...");
      }
      return resourceName;
  }

  reloadHome() {
    window.location.href = '/';
  }

  navigateTo(path: string) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };
    this._router.navigate([path], navigationExtras);
  }

  doesMatchCurrentRoute(expectedRoute: string) {
    return this.currentRoutePath && this.currentRoutePath.join('/') === expectedRoute;
  }

  navigateToUserPage() {
    this.navigateTo(`users/${this.userId}`);
  }

  openResourceInfoModal() {
    this.ngxSmartModalService.getModal('resourceInfoModal').open();
  }

  ngOnDestroy() {
    this.navigateSub.unsubscribe();
  }

}
