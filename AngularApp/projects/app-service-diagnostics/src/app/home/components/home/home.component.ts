import { DetectorControlService, FeatureNavigationService, DetectorResponse } from 'diagnostic-data';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../../../shared-v2/models/category';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { NotificationService } from '../../../shared-v2/services/notification.service';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { HomePageText } from '../../../shared/models/arm/armResourceConfig';
import { ArmService } from '../../../shared/services/arm.service';
import { AuthService } from '../../../startup/services/auth.service';
import { TelemetryService } from 'diagnostic-data';
import { PortalKustoTelemetryService } from '../../../shared/services/portal-kusto-telemetry.service';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { AppType } from '../../../shared/models/portal';
import { DiagnosticService } from 'diagnostic-data';
import { HttpResponse } from '@angular/common/http';
import { Globals } from '../../../globals';
import { PortalActionService } from '../../../shared/services/portal-action.service';
import { VersionTestService } from '../../../fabric-ui/version-test.service';
import { SubscriptionPropertiesService } from '../../../shared/services/subscription-properties.service';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
    useLegacy: boolean = true;
    isWindowsWebApp: boolean = true;
    isExternalSub: boolean = true;
    resourceName: string;
    categories: Category[];
    searchValue = '';
    searchBoxFocus: boolean;
    searchLogTimout: any;
    event: any;
    subscriptionId: string;
    searchResultCount: number;
    homePageText: HomePageText;
    searchPlaceHolder: string;
    providerRegisterUrl: string;
    get inputAriaLabel(): string {
        return this.searchValue !== '' ?
            `${this.searchResultCount} Result` + (this.searchResultCount !== 1 ? 's' : '') :
            '';
    }

    get isIE_Browser(): boolean {
        return /msie\s|trident\//i.test(window.navigator.userAgent);
    }

    get isPublicAzure(): boolean {
        return ((window.location != window.parent.location) ? document.referrer : document.location.href).includes("azure.com");
    }

    constructor(private _resourceService: ResourceService, private _categoryService: CategoryService, private _notificationService: NotificationService, private _router: Router,
        private _detectorControlService: DetectorControlService, private _featureService: FeatureService, private _logger: LoggingV2Service, private _authService: AuthService,
        private _navigator: FeatureNavigationService, private _activatedRoute: ActivatedRoute, private armService: ArmService, private logService: TelemetryService,
        private kustologgingService: PortalKustoTelemetryService, private _diagnosticService: DiagnosticService, private _portalService: PortalActionService, private globals: Globals,
        private versionTestService: VersionTestService, private subscriptionPropertiesService: SubscriptionPropertiesService) {

        this.subscriptionId = this._activatedRoute.snapshot.params['subscriptionid'];
        this.isExternalSub = this.versionTestService.isExternalSub;
        this.versionTestService.isLegacySub.subscribe(isLegacy => this.useLegacy = isLegacy);
        this.versionTestService.isWindowsWebApp.subscribe(isWebAppResource => this.isWindowsWebApp = isWebAppResource);
        
        let initialViewLoaded = this.isWindowsWebApp && !this.isExternalSub ? "new" : "old";
        let eventProps = {
            subscriptionId: this.subscriptionId,
            resourceName: this.resourceName,
            intialView: initialViewLoaded,
        };
        if (!this.useLegacy) {
            eventProps['Version'] = 'V4';
        }
        this.logService.logEvent('DiagnosticsViewLoaded',eventProps);

        if (_resourceService.armResourceConfig && _resourceService.armResourceConfig.homePageText
            && _resourceService.armResourceConfig.homePageText.title && _resourceService.armResourceConfig.homePageText.title.length > 1
            && _resourceService.armResourceConfig.homePageText.description && _resourceService.armResourceConfig.homePageText.description.length > 1
            && _resourceService.armResourceConfig.homePageText.searchBarPlaceHolder && _resourceService.armResourceConfig.homePageText.searchBarPlaceHolder.length > 1) {
            this.homePageText = _resourceService.armResourceConfig.homePageText;
            this.searchPlaceHolder = this.homePageText.searchBarPlaceHolder;
        }
        else {
            if (this._resourceService.resource.type === 'Microsoft.Web/hostingEnvironments') {
                this.homePageText = {
                    title: 'App Service Environment Diagnostics',
                    description: 'Use App Service Environment Diagnostics to investigate how your App Service Environment is performing, diagnose issues, and discover how to\
          improve the availability of your App Service Environment. Select the problem category that best matches the information or tool that you\'re\
          interested in:',
                    searchBarPlaceHolder: 'Search App Service Environment Diagnostics'
                };
                this.searchPlaceHolder = this.homePageText.searchBarPlaceHolder;
            }
            else {
                if (this._resourceService && this._resourceService instanceof WebSitesService && (this._resourceService as WebSitesService).appType === AppType.FunctionApp) {
                    this.homePageText = {
                        title: 'Azure Functions Diagnostics',
                        description: 'Use Azure Functions Diagnostics to investigate how your function app is performing, diagnose issues, and discover how to\
            improve your function app. Select the problem category that best matches the information or tool that you\'re\
            interested in:',
                        searchBarPlaceHolder: 'Search Azure Functions Diagnostics'
                    };
                    this.searchPlaceHolder = this.homePageText.searchBarPlaceHolder;
                }
                else {
                    this.homePageText = {
                        title: 'App Service Diagnostics',
                        description: 'Use App Service Diagnostics to investigate how your app is performing, diagnose issues, and discover how to\
            improve your application. Select the problem category that best matches the information or tool that you\'re\
            interested in:',
                        searchBarPlaceHolder: 'Search App Service Diagnostics'
                    };
                    this.searchPlaceHolder = this.homePageText.searchBarPlaceHolder;
                }
            }
        }

        if (this.useStaticAksText) {
            this.homePageText = {
                title: 'Azure Kubernetes Service Diagnostics',
                description: 'Explore ways to diagnose and troubleshoot the common problems of your cluster from CRUD operations to connection problems. Click on any of the documents below to start troubleshooting.',
                searchBarPlaceHolder: 'Search a keyword that best describes your issue'
            };
        }

        if (_resourceService.armResourceConfig) {
            this._categoryService.initCategoriesForArmResource(_resourceService.resource.id);
        }

        this._categoryService.categories.subscribe(categories => this.categories = categories);

        this._authService.getStartupInfo().subscribe(startupInfo => {
            if (startupInfo.additionalParameters && Object.keys(startupInfo.additionalParameters).length > 0) {
                let path = 'resource' + startupInfo.resourceId.toLowerCase();
                path = this._updateRouteBasedOnAdditionalParameters(path, startupInfo.additionalParameters);
                if (path) {
                    this._router.navigateByUrl(path);
                }
            }
        });

    }

    switchView() {
        this.useLegacy = !this.useLegacy;
        this.versionTestService.setLegacyFlag(this.useLegacy === true ? 1 : 2);
        let eventProps = {
            subscriptionId: this.subscriptionId,
            resourceName: this.resourceName,
            switchToLegacy: this.useLegacy.toString(),
        };
        this.logService.logEvent('SwitchView',eventProps);
    }

    ngOnInit() {
        this.resourceName = this._resourceService.resource.name;
        this.providerRegisterUrl = `/subscriptions/${this.subscriptionId}/providers/Microsoft.ChangeAnalysis/register`;
        if (!this._detectorControlService.startTime) {
            this._detectorControlService.setDefault();
        }

        let locationPlacementId = '';
        this.subscriptionPropertiesService.getSubscriptionProperties(this.subscriptionId).subscribe((response: HttpResponse<{}>) => {
            let subscriptionProperties = response.body['subscriptionPolicies'];
            if (subscriptionProperties) {
                locationPlacementId = subscriptionProperties['locationPlacementId'];
                let eventProps = {
                    subscriptionId: this.subscriptionId,
                    subscriptionLocationPlacementId: locationPlacementId
                };
                this.logService.logEvent('SubscriptionProperties', eventProps);
            }
        });

        if (this._resourceService.resource.type === 'Microsoft.Web/sites') {
            if (locationPlacementId.toLowerCase() !== 'geos_2020-01-01') {
                // Register Change Analysis Resource Provider.
                this.armService.postResourceFullResponse(this.providerRegisterUrl, {}, true, '2018-05-01').subscribe((response: HttpResponse<{}>) => {
                    let eventProps = {
                        url: this.providerRegisterUrl

                    };
                    this.kustologgingService.logEvent("Change Analysis Resource Provider registered", eventProps);
                }, (error: any) => {
                    this.logHTTPError(error, 'registerResourceProvider');
                });
            } else {
                this._categoryService.filterCategoriesForSub();
            }
        }

        if (!this._detectorControlService.startTime) {
            this._detectorControlService.setDefault();
        }

        this.logService.logEvent("telemetry service logging", {});
        this.kustologgingService.logEvent("kusto telemetry service logging", {});
    };

    ngAfterViewInit() {
        document.getElementById("healthCheck").focus();
    }

   
  public get useStaticAksText() : boolean {
    return this.armService.isMooncake 
    && this._resourceService.parseResourceUri(this._resourceService.resourceIdForRouting).provider.toLowerCase() == 'microsoft.containerservice';
  }

    public get isAKSOnNationalCloud(): boolean {
        return this.armService.isNationalCloud
            && this._resourceService.parseResourceUri(this._resourceService.resourceIdForRouting).provider.toLowerCase() == 'microsoft.containerservice';
    }

    onSearchBoxFocus(event: any): void {
        this.searchBoxFocus = true;
    }


    clearSearch() {
        this.searchBoxFocus = false;
        this.searchValue = '';
        this.searchResultCount = 0;
    }

    updateSearchValue(searchValue: string) {
        this.searchValue = searchValue;

        if (this.searchLogTimout) {
            clearTimeout(this.searchLogTimout);
        }

        this.searchLogTimout = setTimeout(() => {
            this._logSearch();
        }, 5000);
    }

    onResultCount(count: number) {
        this.searchResultCount = count;
    }

    onSearchLostFocus() {
        if (this.searchValue === '') {
            this.searchResultCount = 0;
        }
    }

    onFocusClear() {
        if (this.searchValue === '') {
            this.clearSearch();
        }
    }

    private _updateRouteBasedOnAdditionalParameters(route: string, additionalParameters: any): string {
        if (additionalParameters.featurePath) {
            let featurePath: string = additionalParameters.featurePath;
            featurePath = featurePath.startsWith('/') ? featurePath.replace('/', '') : featurePath;

            return `${route}/${featurePath}`;
        }

        return null;
    }

    private _logSearch() {
        this._logger.LogSearch(this.searchValue);
    }

    private logHTTPError(error: any, methodName: string): void {
        let errorLoggingProps = {
            errorMsg: error.message ? error.message : 'Server Error',
            statusCode: error.status ? error.status : 500
        };
        this.kustologgingService.logTrace('HTTP error in ' + methodName, errorLoggingProps);
    }

    openAvaAndPerf() {
        const category = this.categories.find(category => category.name === "Availability and Performance");
        if (category) {
            this._portalService.openBladeDiagnoseCategoryBlade(category.id);
        }
        this.logService.logEvent('OpenAviPerf',{
            'Location':'LandingPage',
            "Version":'V4'
        });
    }

    openGeniePanel() {
        this.globals.openGeniePanel = true;
        this.logService.logEvent('OpenGenie',{
            'Location':'LandingPage',
            'Version':'V4'
        });
    }
}

