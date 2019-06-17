import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArmService } from './../../../shared/services/arm.service';
import { AuthService } from '../../../startup/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ProviderRegistration } from '../../../shared/models/feature-registration';
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
        this.providerStatusUrl = `/subscriptions/${this.subscriptionId}/providers/Microsoft.ChangeAnalysis`;
        this.providerRegistrationUrl = `/subscriptions/${this.subscriptionId}/providers/Microsoft.ChangeAnalysis/register`;
        this.currentResource = this.resourceService.resource;

        this.isRPRegistered.subscribe(_ => this.updateChangeAnalysisEnableStatus());
        this.isHiddenTagAdded.subscribe(_ => this.updateChangeAnalysisEnableStatus());

        this.pollResourceProviderRegStatus();
        this.checkIfCodeScanEnabled();
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

            if (state === 'registered' || state === 'unregistered') {
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

    private checkIfCodeScanEnabled(): void {
        let tags = this.currentResource.tags;
        if (tags && tags[scanTag] === 'true') {
            this.isHiddenTagAdded.next(true);
        } else {
            this.isHiddenTagAdded.next(false);
        }
    }

    private updateChangeAnalysisEnableStatus(): void {
        this.isEnabled = this.isRPRegistered.getValue() && this.isHiddenTagAdded.getValue();
    }

    private registerResourceProvider(): void {
        this.updatingProvider = true;

        let props = {
            armUrl: this.providerRegistrationUrl,
            resourceId: this.resourceId
        };
        this.loggingService.logEvent('RegisterChangeAnalysisResourceProvider', props);

        this.armService.postResourceFullResponse(this.providerRegistrationUrl, {}, true, '2018-05-01').subscribe((response: HttpResponse<{}>) => {
            this.updatingProvider = false;
            this.pollResourceProviderRegStatus();
        }, (error: any) => {
            this.logHTTPError(error, 'registerResourceProvider');
            this.updatingProvider = false;
            this.showGeneralError = true;
            this.generalErrorMsg = this.getGeneralErrorMsg('Unable to register Change Analysis Resource Provider. ', error.status);
        });
    }

    private updateScanTag(enable: boolean): void {
        this.updatingTag = true;
        let tagValue = enable ? 'true' : 'false';
        this.currentResource.tags = this.currentResource.tags ? this.currentResource.tags : {}
        this.currentResource.tags[scanTag] = tagValue;

        let eventProps = {
            tagName: scanTag,
            tagValue: tagValue,
            resourceId: this.resourceId
        };
        this.loggingService.logEvent('UpdateScanTag', eventProps);

        this.armService.patchResource(this.currentResource.id, this.currentResource).subscribe((response: any) => {
            this.updatingTag = false;
            if (response && response.tags && response.tags[scanTag] === 'true') {
                this.isHiddenTagAdded.next(true);
            } else {
                this.isHiddenTagAdded.next(false);
            }
        }, (error: any) => {
            this.logHTTPError(error, 'updateScanTag');
            this.updatingTag = false;
            this.showGeneralError = true;
            this.generalErrorMsg = this.getGeneralErrorMsg('Error occurred when trying to enable Change Analysis. ', error.status);
        });
    }

    saveSettings(): void {
        this.clearErrors();

        // Register the Resource Provider
        if (this.enableButtonSelectedValue && !this.isRPRegistered.getValue()) {
            this.registerResourceProvider();
        }

        // Update hidden tag
        this.updateScanTag(this.enableButtonSelectedValue);
    }

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
}
