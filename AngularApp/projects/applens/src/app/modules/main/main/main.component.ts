import { AdalService } from 'adal-angular4';
import * as momentNs from 'moment';
import { map } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import {
    ResourceServiceInputs, ResourceType, ResourceTypeState
} from '../../../shared/models/resources';
import { trimTrailingNulls } from '@angular/compiler/src/render3/view/util';
const moment = momentNs;

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  showResourceTypeOptions: boolean = false;
  showCaseCleansingOption: boolean = false;
  selectedResourceType: ResourceTypeState;
  resourceName: string;
  resourceTypes: ResourceTypeState[] = [
    {
      resourceType: ResourceType.Site,
      routeName: (name) => `sites/${name}`,
      displayName: 'App',
      enabled: true,
      caseId: false
    },
    {
      resourceType: ResourceType.AppServiceEnvironment,
      routeName: (name) => `hostingEnvironments/${name}`,
      displayName: 'App Service Environment',
      enabled: true,
      caseId: false
    },
    {
      resourceType: null,
      routeName: (name) => `${name}/home`,
      displayName: 'ARM Resource ID',
      enabled: true,
      caseId: false
    },
    {
      resourceType: null,
      routeName: () => 'srid',
      displayName: 'Support Request ID',
      enabled: true,
      caseId: true
    }
  ];

  startTime: momentNs.Moment;
  endTime: momentNs.Moment;

  contentHeight: string;

  enabledResourceTypes: ResourceServiceInputs[];

  inIFrame: boolean = false;

  errorMessage:string = "";

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _http: Http, private _adalService: AdalService,) {
    this.endTime = moment.utc();
    this.startTime = this.endTime.clone().add(-1, 'days');

    this.contentHeight = window.innerHeight + 'px';

    this.inIFrame = window.parent !== window;

    if (this.inIFrame) {
      this.resourceTypes = this.resourceTypes.filter(resourceType => !resourceType.caseId);
    }

    // TODO: Use this to restrict access to routes that don't match a supported resource type
    this._http.get('assets/enabledResourceTypes.json').pipe(map(response => {
      this.enabledResourceTypes = <ResourceServiceInputs[]>response.json().enabledResourceTypes;
    }));

    if (_adalService.userInfo.userName === 'cmaher@microsoft.com' || _adalService.userInfo.userName === "shgup@microsoft.com"){
      this.showCaseCleansingOption = true;
    }
  }

  ngOnInit() {
    this.selectedResourceType = this.resourceTypes[0];
  }

  selectResourceType(type: ResourceTypeState) {
    if (type.enabled) {
      this.selectedResourceType = type;
      this.showResourceTypeOptions = false
    }
  }

  private normalizeArmUriForRoute( resourceURI: string) : string {
    resourceURI = resourceURI.trim();    
    var resourceUriPattern = /subscriptions\/(.*)\/resourceGroups\/(.*)\/providers\/(.*)/i;
    var result = resourceURI.match(resourceUriPattern);
    if(result && result.length === 4){
      this.errorMessage = "";
      return `subscriptions/${result[1]}/resourceGroups/${result[2]}/providers/${result[3]}`;
    }
    else{
      this.errorMessage = `Invalid ARM resource id. Resource id must be of the following format.
e.g..
  /subscriptions/SUBSCRIPTION_ID/resourceGroups/MY_RG/providers/Microsoft.ContainerService/managedClusters/RESOURCE_NAME`;
      return resourceURI;
    }    
  }

  onSubmit(form: any) {
    
    form.resourceName = form.resourceName.trim();
    
    if(this.selectedResourceType.displayName === "ARM Resource ID"){
      form.resourceName = this.normalizeArmUriForRoute(form.resourceName);
    }
    else{
      this.errorMessage = "";
    }

    let route = this.selectedResourceType.routeName(form.resourceName);

    if (route === 'srid') {
      window.location.href = `https://azuresupportcenter.msftcloudes.com/caseoverview?srId=${form.resourceName}`;
    }

    let startUtc = moment.utc(form.startTime.format('YYYY-MM-DD HH:mm'));
    let endUtc = moment.utc(form.endTime.format('YYYY-MM-DD HH:mm'));

    let timeParams = {
      startTime: startUtc.format('YYYY-MM-DDTHH:mm'),
      endTime: endUtc.format('YYYY-MM-DDTHH:mm')
    }

    let navigationExtras: NavigationExtras = {
      queryParams: timeParams
    }
    
    if(this.errorMessage === "")
      this._router.navigate([route], navigationExtras);
  }

  caseCleansingNavigate(){
    this._router.navigate(["caseCleansing"]);
  }
}
