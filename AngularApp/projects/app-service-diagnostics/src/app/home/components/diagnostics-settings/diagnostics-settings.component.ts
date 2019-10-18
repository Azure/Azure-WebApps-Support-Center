import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArmService } from './../../../shared/services/arm.service';
import { AuthService } from '../../../startup/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ProviderRegistration, FeatureRegistration } from '../../../shared/models/feature-registration';
import { Subscription, timer, BehaviorSubject } from 'rxjs';
import { ArmResource } from '../../../shared-v2/models/arm';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { PortalKustoTelemetryService } from '../../../shared/services/portal-kusto-telemetry.service';
import { HttpResponse } from '@angular/common/http';

const scanTag = "hidden-related:diagnostics/changeAnalysisScanEnabled";

@Component({
    selector: 'diagnostics-settings',
    templateUrl: './diagnostics-settings.component.html',
    styleUrls: ['./diagnostics-settings.component.scss']
})

export class DiagnosticsSettingsComponent implements OnInit, OnDestroy {
    // Loading related properties
    showResourceProviderRegStatus: boolean = false;
    pollingResourceProviderRegProgress: boolean = false;
    isEnabled = false;
    enableButtonSelectedValue: boolean | null = null;
    updatingProvider: boolean = false;
    updatingTag: boolean = false;
    resourceProviderRegState: string = '';
    showGeneralError: boolean = false;
    generalErrorMsg: string = '';

    // Resource Properties
    private subscriptionId: string;
    private currentResource: ArmResource;
    private resourceId: string = '';
    private servicePlanId: string = '';

    servicePlan: ArmResource;
    webApps: ArmResource[];
    enableButtonSelectedArray: boolean[];
    private isHiddenTagsArrayChanged: BehaviorSubject<boolean[]> = new BehaviorSubject<boolean[]>([]);
    private isPlanHiddenTagsChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    // ARM Urls
    private providerStatusUrl: string = '';
    private providerRegistrationUrl: string = '';

    // Registration Status
    private pollResourceProviderStatusSubscription: Subscription;
    private isRPRegistered: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private isHiddenTagAdded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(private armService: ArmService, private authService: AuthService,
        private activatedRoute: ActivatedRoute, private resourceService: ResourceService,
        private loggingService: PortalKustoTelemetryService) { }

    ngOnInit() {
        this.subscriptionId = this.activatedRoute.snapshot.params['subscriptionid'];
        this.authService.getStartupInfo().subscribe(data => {
            this.resourceId = data.resourceId;
        });
        
        this.armService.getResourceFullResponse<any>(this.resourceId,true,'2016-08-01').subscribe(response => {
            let appServicePlanResponse = <ArmResource>response.body;
            this.servicePlanId = appServicePlanResponse.properties.serverFarmId;

            //get app service plan
            this.armService.getResourceFullResponse<any>(this.servicePlanId,true,'2016-09-01').subscribe(response => {
                this.servicePlan = <ArmResource>response.body;
                const isHiddenTagsEnabled =  this.checkScanPlanEnabled(this.servicePlan);
                this.isPlanHiddenTagsChanged.next(isHiddenTagsEnabled);
                console.log(this.servicePlan);
            },(error:any) => {
                this.logHTTPError(error, 'Can not fetch App Service Plan,');
                this.showGeneralError = true;
                this.generalErrorMsg = this.getGeneralErrorMsg('Can not fetch App Service Plan,', error.status);
            });

            //get all web app under this app service plan
            this.armService.getResourceFullResponse<any>(`${this.servicePlanId}/sites`,true,'2016-09-01').subscribe(response => {
                this.webApps = <ArmResource[]>response.body.value;

                const updatedHiddenTagsArray = this.webApps.map(webapp => {
                    return this.checkScanPlanEnabled(webapp);
                });
                this.isHiddenTagsArrayChanged.next(updatedHiddenTagsArray);
                console.log(this.webApps);
            });
        });

        this.isHiddenTagsArrayChanged.subscribe(data => {
            //this.isEnabledArray = data;
            this.enableButtonSelectedArray = data;
        });

        this.isPlanHiddenTagsChanged.subscribe(data => {
            this.isEnabled = data;
        });
        

        this.providerStatusUrl = `/subscriptions/${this.subscriptionId}/providers/Microsoft.ChangeAnalysis`;
        this.providerRegistrationUrl = `/subscriptions/${this.subscriptionId}/providers/Microsoft.ChangeAnalysis/register`;
        this.currentResource = this.resourceService.resource;

        //this.isRPRegistered.subscribe(_ => this.updateChangeAnalysisEnableStatus());
        //this.isHiddenTagAdded.subscribe(_ => this.updateChangeAnalysisEnableStatus());

        this.pollResourceProviderRegStatus();
        //this.checkIfCodeScanEnabled();
    }

    private pollResourceProviderRegStatus(): void {
        this.pollingResourceProviderRegProgress = true;
        this.pollResourceProviderStatusSubscription = timer(0, 5000).subscribe(_ => {
            this.checkIfResourceProviderRegistered();
        });
    }

    private checkIfResourceProviderRegistered(): void {
        this.armService.getResourceFullResponse<any>(this.providerStatusUrl, true, '2018-05-01').subscribe(response => {
            let providerRegistrationStateResponse = <ProviderRegistration>response.body;
            let state = providerRegistrationStateResponse.registrationState.toLowerCase();
            this.resourceProviderRegState = state;

            if (state === 'registered' || state === 'unregistered' || state === 'notregistered') {
                this.pollingResourceProviderRegProgress = false;
                this.showResourceProviderRegStatus = false;
                if (this.pollResourceProviderStatusSubscription) {
                    this.pollResourceProviderStatusSubscription.unsubscribe();
                }

                this.isRPRegistered.next(state === 'registered' ? true : false);
            } else {
                // only show the regstration status when it needs long polling
                this.showResourceProviderRegStatus = true;
            }
        }, (error: any) => {
            this.logHTTPError(error, 'checkIfResourceProviderRegistered');
            this.pollingResourceProviderRegProgress = false;
            this.showResourceProviderRegStatus = false;
            this.showGeneralError = true;
            this.generalErrorMsg = this.getGeneralErrorMsg('Unable to check Change Analysis Resource Provider status. ', error.status);
            if (this.pollResourceProviderStatusSubscription) {
                this.pollResourceProviderStatusSubscription.unsubscribe();
            }
        });
    }

    // private checkIfCodeScanEnabled(): void {
    //     let tags = this.currentResource.tags;
    //     if (tags && tags[scanTag] === 'true') {
    //         this.isHiddenTagAdded.next(true);
    //     } else {
    //         this.isHiddenTagAdded.next(false);
    //     }
    // }

    private checkScanPlanEnabled(resource:ArmResource): boolean {
        let tags = resource.tags;
        if (tags && tags[scanTag] === 'true') {
            return true;
        }
        return false;
    }

    // private updateChangeAnalysisEnableStatus(): void {
    //     this.isEnabled = this.isRPRegistered.getValue() && this.isHiddenTagAdded.getValue();
    // }

    // private registerResourceProvider(): void {
    //     this.updatingProvider = true;

    //     let props = {
    //         armUrl: this.providerRegistrationUrl,
    //         resourceId: this.resourceId
    //     };
    //     this.loggingService.logEvent('RegisterChangeAnalysisResourceProvider', props);

    //     this.armService.postResourceFullResponse(this.providerRegistrationUrl, {}, true, '2018-05-01').subscribe((response: HttpResponse<{}>) => {
    //         this.updatingProvider = false;
    //         this.pollResourceProviderRegStatus();
    //     }, (error: any) => {
    //         this.logHTTPError(error, 'registerResourceProvider');
    //         this.updatingProvider = false;
    //         this.showGeneralError = true;
    //         this.generalErrorMsg = this.getGeneralErrorMsg('Unable to register Change Analysis Resource Provider. ', error.status);
    //     });
    // }

    //update app web scan tag
    // private updateScanTag(enable: boolean): void {
    //     this.updatingTag = true;
    //     let tagValue = enable ? 'true' : 'false';
    //     this.currentResource.tags = this.currentResource.tags ? this.currentResource.tags : {}
    //     this.currentResource.tags[scanTag] = tagValue;

    //     let eventProps = {
    //         tagName: scanTag,
    //         tagValue: tagValue,
    //         resourceId: this.resourceId
    //     };
    //     this.loggingService.logEvent('UpdateScanTag', eventProps);

    //     this.armService.patchResourceFullResponse(this.currentResource.id, this.currentResource, true).subscribe((response: HttpResponse<{}>) => {
    //         this.updatingTag = false;
    //         let resource = <ArmResource>response.body;
    //         if (resource && resource.tags && resource.tags[scanTag] === 'true') {
    //             this.isHiddenTagAdded.next(true);
    //         } else {
    //             this.isHiddenTagAdded.next(false);
    //         }
    //     }, (error: any) => {
    //         this.logHTTPError(error, 'updateScanTag');
    //         this.updatingTag = false;
    //         this.showGeneralError = true;
    //         this.generalErrorMsg = this.getGeneralErrorMsg('Error occurred when trying to enable Change Analysis. ', error.status);
    //     });
    // }

    //saveSettings(): void {
        //this.clearErrors();

        // Register the Resource Provider
        // if (this.enableButtonSelectedValue && !this.isRPRegistered.getValue()) {
        //     this.registerResourceProvider();
        // }

        // Update hidden tag
        //this.updateScanTag(this.enableButtonSelectedValue);
    //}

    private logHTTPError(error: any, methodName: string): void {
        let errorLoggingProps = {
            errorMsg: error.message ? error.message : 'Server Error',
            statusCode: error.status ? error.status : 500
        };
        this.loggingService.logTrace('HTTP error in ' + methodName, errorLoggingProps);
    }

    private clearErrors(): void {
        this.generalErrorMsg = '';
        this.showGeneralError = false;
    }

    ngOnDestroy(): void {
        this.unregisterSubscription(this.pollResourceProviderStatusSubscription);
    }

    private unregisterSubscription(subscription: Subscription): void {
        if (subscription) {
            subscription.unsubscribe();
        }
    }

    private getGeneralErrorMsg(baseMsg: string, errorStatus: number) {
        if (errorStatus === 403) {
            return baseMsg + 'You may not have sufficient permissions to perform this operation. Make sure you have required permissions for this subscription and try again.';
        } else if (errorStatus === 401) {
            return baseMsg + 'Your token may have expired. Please refresh and try again.';
        } else {
            return baseMsg + 'Please try again later.';
        }
    }

    togglePlanHandler(event:boolean): void {
        this.isPlanHiddenTagsChanged.next(event);
        const enableButtonSelectedArray = this.enableButtonSelectedArray.map(_ => event);
        this.isHiddenTagsArrayChanged.next(enableButtonSelectedArray);
    }

    toggleHandler(event:boolean,index:number): void {
        const tempArray = [...this.enableButtonSelectedArray];
        tempArray[index] = event;
        this.isHiddenTagsArrayChanged.next(tempArray);
    }

    clickHandler(): void {
        this.checkDiff();
        console.log(this.enableButtonSelectedArray);
    }

    checkDiff() {
        this.clearErrors();
        this.updateServicePlaTag(this.isEnabled);
    }

    private updateServicePlaTag(enable:boolean):void {
        this.updatingTag = true;
        let tagValue = enable ? 'true' : 'false';
        this.servicePlan.tags = this.servicePlan.tags ? this.servicePlan.tags : {};
        this.servicePlan.tags[scanTag] = tagValue;
        this.armService.patchResourceFullResponse(this.servicePlan.id,this.servicePlan,true).subscribe((response: HttpResponse<{}>) => {
            const length = this.enableButtonSelectedArray.length;
            const isPlanEnabled = this.isEnabled;

            let eventProps = {
                tagName: scanTag,
                tagValue: tagValue,
                servicePlanId: this.servicePlanId
            };
            this.loggingService.logEvent('updateServicePlaTag', eventProps);

            // if (data && data.tags && data.tags[scanTag] == "true") {
            //     this.isPlanHiddenTagsChanged.next(true);
            // } else {
            //     this.isPlanHiddenTagsChanged.next(false);
            // }
            if (response.status < 300) {
                this.isPlanHiddenTagsChanged.next(enable);
            } 
            setTimeout(() => {
                for (let i = 0;i < length;i++) {
                    if (this.enableButtonSelectedArray[i] !== isPlanEnabled) {
                        this.updateWebAppTag(this.enableButtonSelectedArray[i],i);
                    }
                }
            }, 1500);
            
        },(error:any) => {
            this.logHTTPError(error, 'updateServicePlaTag');
            this.updatingTag = false;
            this.showGeneralError = true;
            this.generalErrorMsg = this.getGeneralErrorMsg('Error occurred when trying to update service plan tag. ', error.status);    
        })
    }

    private updateWebAppTag(enable:boolean,index:number):void {
        this.updatingTag = true;
        let tagValue = enable ? 'true' : 'false';
        let webapp = this.webApps[index];

        webapp.tags = webapp.tags ? webapp.tags : {}
        webapp.tags[scanTag] = tagValue;
        webapp.type = "Microsoft.Web/sites";
        webapp.properties.serverFarmId = this.servicePlanId;
        webapp.properties.serverFarm = null;

        this.armService.patchResourceFullResponse(webapp.id,webapp,true).subscribe((response: HttpResponse<{}>) => {
            this.updatingTag = false;
            let data = <ArmResource>response.body;

            let eventProps = {
                tagName: scanTag,
                tagValue: tagValue,
                webAppId: webapp.id
            };
            this.loggingService.logEvent('updateServicePlaTag', eventProps);

            if (data && data.tags && data.tags[scanTag] == "true") {
                this.checkAndDispatch(true,index);
            } else {
                this.checkAndDispatch(false,index);
            }

        },(error:any) => {
            this.logHTTPError(error, 'updateWebAppTag');
            this.updatingTag = false;
            this.showGeneralError = true;
            this.generalErrorMsg = this.getGeneralErrorMsg(`Error occurred when trying to update ${webapp.name} tag. `, error.status);    
        })

    }


    private checkAndDispatch(enable:boolean,index:number):void {
        const hiddenTagArray = this.enableButtonSelectedArray;
        hiddenTagArray[index] = enable;
        this.isHiddenTagsArrayChanged.next(hiddenTagArray);
    }
}
