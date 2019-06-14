import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArmService } from './../../../shared/services/arm.service';
import { AuthService } from '../../../startup/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { FeatureRegistration, ProviderRegistration } from '../../../shared/models/feature-registration';
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
    pollingFeatureRegStatus: boolean = false;
    pollingResourceProviderRegProgress: boolean = false;
    isEnabled = false;
    enableButtonSelectedValue: boolean | null = null;
    updatingProvider: boolean = false;
    updatingTag: boolean = false;
    resourceProviderRegState: string = '';
    showGeneralError: boolean = false;
    generalErrorMsg: string = '';

    // Resource Properties
    private _subscriptionId: string;
    private _currentResource: ArmResource;
    private _resourceId: string = '';

    // ARM Urls
    private _featureRegUrl: string = '';
    private _providerRegUrl: string = '';

    // Registration Status
    private _pollFeatureFlagStatusSubscription: Subscription;
    private _pollResourceProviderStatusSubscription: Subscription;
    private _isRPRegistered: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private _isHiddenTagAdded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(private armService: ArmService, private authService: AuthService,
        private activatedRoute: ActivatedRoute, private resourceService: ResourceService,
        private loggingService: PortalKustoTelemetryService) { }

    ngOnInit() {
        this._subscriptionId = this.activatedRoute.snapshot.params['subscriptionid'];
        this.authService.getStartupInfo().subscribe(data => {
            this._resourceId = data.resourceId;
        });
        this._featureRegUrl = `/subscriptions/${this._subscriptionId}/providers/Microsoft.Features/providers/Microsoft.ChangeAnalysis/features/PreviewAccess`;
        this._providerRegUrl = `/subscriptions/${this._subscriptionId}/providers/Microsoft.ChangeAnalysis`;
        this._currentResource = this.resourceService.resource;

        this._isRPRegistered.subscribe(_ => this._checkChangeAnalysisEnableStatus());
        this._isHiddenTagAdded.subscribe(_ => this._checkChangeAnalysisEnableStatus());

        this._pollFeatureFlagRegStatus();
    }

    private _pollFeatureFlagRegStatus(): void {
        this.pollingFeatureRegStatus = true;
        this._pollFeatureFlagStatusSubscription = timer(0, 20000).subscribe(_ => {
            this._checkIfFeatureFlagRegistered();
        });
    }

    private _checkIfFeatureFlagRegistered(): void {
        this.armService.getResourceFullResponse<any>(this._featureRegUrl, true, '2015-12-01').subscribe(response => {
            let featureRegistrationStateResponse = <FeatureRegistration>response.body;
            let state = featureRegistrationStateResponse.properties.state;
            // Stop polling once its registered
            if (state.toLowerCase() === 'registered') {
                this.pollingFeatureRegStatus = false;
                if (this._pollFeatureFlagStatusSubscription) {
                    this._pollFeatureFlagStatusSubscription.unsubscribe();
                }

                this._pollResourceProviderRegStatus();
                this._checkIfCodeScanEnabled();
            }
        }, (error: any) => {
            this.logHTTPError(error, 'checkIfFeatureFlagRegistered');
            this.pollingFeatureRegStatus = false;
            this.showGeneralError = true;
            this.generalErrorMsg = this._getGeneralErrorMsg('Unable to check Change Anaylsis feature status. ', error.status);
            if (this._pollFeatureFlagStatusSubscription) {
                this._pollFeatureFlagStatusSubscription.unsubscribe();
            }
        });
    }

    private _pollResourceProviderRegStatus(): void {
        this.pollingResourceProviderRegProgress = true;
        this._pollResourceProviderStatusSubscription = timer(0, 5000).subscribe(_ => {
            this._checkIfResourceProviderRegistered();
        });
    }

    private _checkIfResourceProviderRegistered(): void {
        this.armService.getResourceFullResponse<any>(this._providerRegUrl, true, '2018-05-01').subscribe(response => {
            let providerRegistrationStateResponse = <ProviderRegistration>response.body;
            let state = providerRegistrationStateResponse.registrationState.toLowerCase();
            this.resourceProviderRegState = state;

            if (state === 'registered' || state === 'unregistered') {
                this.pollingResourceProviderRegProgress = false;
                if (this._pollResourceProviderStatusSubscription) {
                    this._pollResourceProviderStatusSubscription.unsubscribe();
                }

                this._isRPRegistered.next(state === 'registered' ? true : false);
            }
        }, (error: any) => {
            this.logHTTPError(error, 'checkIfResourceProviderRegistered');
            this.pollingResourceProviderRegProgress = false;
            this.showGeneralError = true;
            this.generalErrorMsg = this._getGeneralErrorMsg('Unable to check Change Analysis Resource Provider status. ', error.status);
            if (this._pollResourceProviderStatusSubscription) {
                this._pollResourceProviderStatusSubscription.unsubscribe();
            }
        })
    }

    private _checkIfCodeScanEnabled(): void {
        let tags = this._currentResource.tags;
        if (tags && tags[scanTag] === 'true') {
            this._isHiddenTagAdded.next(true);
        } else {
            this._isHiddenTagAdded.next(false);
        }
    }

    private _checkChangeAnalysisEnableStatus(): void {
        this.isEnabled = this._isRPRegistered.getValue() && this._isHiddenTagAdded.getValue();
    }

    private _registerResourceProvider(): void {
        this.updatingProvider = true;

        let url = `/subscriptions/${this._subscriptionId}/providers/Microsoft.ChangeAnalysis/register`;
        let props = {
            armUrl: url,
            resourceId: this._resourceId
        };
        this.loggingService.logEvent('RegisterChangeAnalysisResourceProvider', props);

        this.armService.postResourceFullResponse(url, {}, true, '2018-05-01').subscribe((response: HttpResponse<{}>) => {
            this.updatingProvider = false;
            this._pollResourceProviderRegStatus();
        }, (error: any) => {
            this.logHTTPError(error, 'registerResourceProvider');
            this.updatingProvider = false;
            this.showGeneralError = true;
            this.generalErrorMsg = this._getGeneralErrorMsg('Unable to register Change Analysis Resource Provider. ', error.status);
        });
    }

    private _updateScanTag(enable: boolean): void {
        this.updatingTag = true;
        let tagValue = enable ? 'true' : 'false';
        this._currentResource.tags = this._currentResource.tags ? this._currentResource.tags : {}
        this._currentResource.tags[scanTag] = tagValue;

        let eventProps = {
            tagName: scanTag,
            tagValue: tagValue,
            resourceId: this._resourceId
        };
        this.loggingService.logEvent('UpdateScanTag', eventProps);

        this.armService.patchResource(this._currentResource.id, this._currentResource).subscribe((response: any) => {
            this.updatingTag = false;
            if (response && response.tags && response.tags[scanTag] === 'true') {
                this._isHiddenTagAdded.next(true);
            } else {
                this._isHiddenTagAdded.next(false);
            }
        }, (error: any) => {
            this.logHTTPError(error, 'updateScanTag');
            this.updatingTag = false;
            this.showGeneralError = true;
            this.generalErrorMsg = this._getGeneralErrorMsg('Unable to add scan tag. ', error.status);
        });
    }

    saveSettings(): void {
        this.clearErrors();

        // Register the Resource Provider
        if (this.enableButtonSelectedValue && !this._isRPRegistered.getValue()) {
            this._registerResourceProvider();
        }

        // Update hidden tag
        this._updateScanTag(this.enableButtonSelectedValue);
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
        this._unregisterSubscription(this._pollFeatureFlagStatusSubscription);
        this._unregisterSubscription(this._pollResourceProviderStatusSubscription);
    }

    private _unregisterSubscription(subscription: Subscription): void {
        if (subscription) {
            subscription.unsubscribe();
        }
    }

    private _getGeneralErrorMsg(baseMsg: string, errorStatus: number) {
        if (errorStatus === 403) {
            return baseMsg + 'You may not have sufficient permissions to perform this operation. Make sure you have required permissions for this subscription and try again.';
        } else if (errorStatus === 401) {
            return baseMsg + 'Your token may have expired. Please refresh and try again.';
        } else {
            return baseMsg + 'Please try again later.';
        }
    }
}
