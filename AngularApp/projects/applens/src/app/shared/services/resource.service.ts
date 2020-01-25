
import {of as observableOf,  Observable } from 'rxjs';
import { Injectable, Inject } from '@angular/core';
import { ArmResource, ResourceServiceInputs, RESOURCE_SERVICE_INPUTS } from '../models/resources';

@Injectable()
export class ResourceService {

  public imgSrc: string;
  public versionPrefix: string;
  public templateFileName: string;
  public azureCommImpactedServicesList: string;
  public pesId: string;
  public staticSelfHelpContent: string;
  public altIcons: { [path: string]: string };
  public searchSuffix: string;

  protected _observerResource: any = null;
  protected _armResource: ArmResource;
  protected _initialized: Observable<boolean>;

  constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs) {
    this._armResource = inputs.armResource;
    this.templateFileName = inputs.templateFileName;
    this.imgSrc = inputs.imgSrc;
    this.versionPrefix = inputs.versionPrefix;
    this.azureCommImpactedServicesList = inputs.azureCommImpactedServicesList;
    this.pesId = inputs.pesId;
    this.staticSelfHelpContent = inputs.staticSelfHelpContent;
    this.altIcons = inputs.altIcons;
    this.searchSuffix = inputs.searchSuffix;
  }

  public startInitializationObservable() {
    this._initialized = observableOf(true);
  }

  public waitForInitialization(): Observable<boolean> {
    return this._initialized;
  }

  public get ArmResource(): ArmResource {
    return this._armResource;
  }

  public getResourceName(): string {
    return this._armResource.resourceName;
  }

  public getCurrentResourceId(forDiagApi?: boolean): string {
    return `subscriptions/${this._armResource.subscriptionId}/resourceGroups/${this._armResource.resourceGroup}/providers/${this._armResource.provider}/${this._armResource.resourceTypeName}/${this._armResource.resourceName}`;
  }

  public getCurrentResource(): Observable<any> {
    return observableOf(this._armResource);
  }

  public getResourceByObserver(): any {
    return this._observerResource;
  }
}
