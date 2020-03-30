
import {of,  Observable, BehaviorSubject } from 'rxjs';
import { map, flatMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { ArmResource } from '../models/arm';
import { ArmService } from '../../shared/services/arm.service';
import { ArmResourceConfig, ResourceDescriptor, ResourceDescriptorGroups } from '../../shared/models/arm/armResourceConfig';
import { GenericArmConfigService } from '../../shared/services/generic-arm-config.service';
import { PortalReferrerMap } from '../../shared/models/portal-referrer-map';

@Injectable({providedIn: 'root'})
export class ResourceService {

  protected _subscription: string;

  public resource: ArmResource;

  public warmUpCallFinished: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  public error: any;

  constructor(protected _armService: ArmService, private _genericArmConfigService?: GenericArmConfigService) { }

  private _initialize() {
    const pieces = this.resource.id.toLowerCase().split('/');
    this._subscription = pieces[pieces.indexOf('subscriptions') + 1];
  }

  public get resourceIdForRouting() {
    return this.resource.id.toLowerCase();
  }

  public get armResourceConfig(): ArmResourceConfig {
    if (this._genericArmConfigService) {
      return this._genericArmConfigService.getArmResourceConfig(this.resource.id);
    }
    else {
      return null;
    }
  }

  public getIbizaBladeToDetectorMapings():Observable<PortalReferrerMap[]> {
    return of(null);
  }

  public getPesId(): Observable<string>{
    if (this.armResourceConfig){
      return of(this.armResourceConfig.pesId);
    }
    return of(null);
  }

  public get searchSuffix(): string {
    if (this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(this.resource.id);
      if (currConfig.searchSuffix) {
        return currConfig.searchSuffix;
      }
      else {
        return 'Azure';
      }
    }
    else {
      return 'Azure';
    }
  }

  public get azureServiceName(): string {
    if (this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(this.resource.id);
      if (currConfig.azureServiceName) {
        return currConfig.azureServiceName;
      }
      else {
        return '';
      }
    }
    else {
      return '';
    }
  }

  public get subscriptionId(): string {
    return this._subscription;
  }

  public get isApplicableForLiveChat(): boolean {
    if (this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(this.resource.id);
      if ( currConfig.liveChatConfig && typeof currConfig.liveChatConfig.isApplicableForLiveChat == 'boolean') {
        return currConfig.liveChatConfig.isApplicableForLiveChat;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  }

  public get liveChatEnabledSupportTopicIds():string[] {
    if(this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(this.resource.id);
      if(this.isApplicableForLiveChat === true) {
        if ( currConfig.liveChatConfig && currConfig.liveChatConfig.supportTopicIds
          &&  currConfig.liveChatConfig.supportTopicIds instanceof Array  
          && currConfig.liveChatConfig.supportTopicIds.length > 0 ) {
          return currConfig.liveChatConfig.supportTopicIds;
        }
        else {
          return [];
        }
      }
      else {
        return [];
      }
    }
  }

  public registerResource(resourceUri: string): Observable<{} | ArmResource> {
    if (this._genericArmConfigService && resourceUri.indexOf('hostingenvironments') < 0) {
      return this._genericArmConfigService.initArmConfig(resourceUri).pipe(
        flatMap(value => {
          return this._armService.getArmResource<ArmResource>(resourceUri).pipe(
            map(resource => {
              this.resource = resource;
              this._initialize();
              this.makeWarmUpCalls();
              return resource;
            }));
        })
      );
    }
    else {
      return this._armService.getArmResource<ArmResource>(resourceUri).pipe(
        map(resource => {
          this.resource = resource;
          this._initialize();
          this.makeWarmUpCalls();
          return resource;
        }));
    }
  }


  public parseResourceUri(resourceUri: string): ResourceDescriptor {
    let resourceDesc: ResourceDescriptor = new ResourceDescriptor();
    if (resourceUri) {
      if (!resourceUri.startsWith('/')) {
        resourceUri = '/' + resourceUri;
      }

      var result = resourceUri.match(resourceDesc.resourceUriRegExp);
      if (result && result.length > 0) {

        if (result[ResourceDescriptorGroups.subscription]) {
          resourceDesc.subscription = result[ResourceDescriptorGroups.subscription];
        }
        else {
          resourceDesc.subscription = '';
        }

        if (result[ResourceDescriptorGroups.resourceGroup]) {
          resourceDesc.resourceGroup = result[ResourceDescriptorGroups.resourceGroup];
        }
        else {
          resourceDesc.resourceGroup = '';
        }

        if (result[ResourceDescriptorGroups.provider]) {
          resourceDesc.provider = result[ResourceDescriptorGroups.provider];
        }
        else {
          resourceDesc.provider = '';
        }

        if (result[ResourceDescriptorGroups.resource]) {
          const resourceParts = result[ResourceDescriptorGroups.resource].split('/');
          if (resourceParts.length % 2 != 0) {
            //ARM URI is incorrect. The resource section contains an uneven number of parts
            resourceDesc.resource = '';
          }
          else {
            for (var i = 0; i < resourceParts.length; i += 2) {
              resourceDesc.type = resourceParts[i];
              resourceDesc.resource = resourceParts[i + 1];

              resourceDesc.types.push(resourceDesc.type);
              resourceDesc.resources.push(resourceDesc.resource);
            }
          }
        }
        else {
          resourceDesc.resource = '';
        }

      }
    }
    return resourceDesc;
  }



  protected makeWarmUpCalls() {
    //No warm up calls in base
  }
}
