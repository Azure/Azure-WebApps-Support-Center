import { Component, OnInit } from '@angular/core';
import { MessageBarType, IMessageBarProps, IMessageBarStyles } from 'office-ui-fabric-react';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Globals } from '../../../globals';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { NotificationService } from '../../../shared-v2/services/notification.service';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { AuthService } from '../../../startup/services/auth.service';


@Component({
    selector: 'risk-alerts-notification',
    templateUrl: './risk-alerts-notification.component.html',
    styleUrls: ['./risk-alerts-notification.component.scss']
})
export class RiskAlertsNotificationComponent implements OnInit {
    showRiskAlertsNotification: boolean = false;
    type: MessageBarType = MessageBarType.severeWarning;
    riskAlertChecksHealthy: boolean = false;
    reliabilityChecksResults: any = {};
    styles: IMessageBarStyles = {
        root: {
            height: '49px',
            backgroundColor: '#FEF0F1',
            marginBottom: '13px'
        }
    }
    constructor(private _resourceService: ResourceService, private globals: Globals, private _authService: AuthService) { }

    ngOnInit() {
        const autoHealEnabledTitle: string = "Auto-Heal is enabled.";
        const autoHealEnabledDescription: string = "Auto-Heal is highly recommended for production applications that need to ensure high availability and resilience. Although Auto-Heal is not an eventual fix for issues your application may encounter, it allows your application to quickly recover from unexpected issues whether they be platform or application and stay available for customers. If Auto-Heal is being triggerred repeatedly. Re-examine the rule and ensure trigger values aren't too aggressive. Investigate the cause for a proper fix.";
        const autoHealDisabledTitle: string = "Auto-Heal is not enabled.";
        const autoHealDisabledDescription: string = "Auto-Heal is highly recommended for production applications that need to ensure high availability and resilience. Although Auto-Heal is not an eventual fix for issues your application may encounter, it allows your application to quickly recover from unexpected issues whether they be platform or application and stay available for customers. If Auto-Heal is being triggerred repeatedly. Re-examine the rule and ensure trigger values aren't too aggressive. Investigate the cause for a proper fix. Note: Please ignore this message if you have Auto-Heal enabled in web.config but not via configuration settings. This checks the current Auto-Heal setttings.";
        const autoHealLearnMore: string = "https://azure.github.io/AppService/2018/09/10/Announcing-the-New-Auto-Healing-Experience-in-App-Service-Diagnostics.html";

        const healthCheckDisabledTitle = "Health Check is not enabled.";
        const healthCheckDisabledDescription = "This feature will ping the specified health check path on all instances of your webapp every 2 minutes. If an instance does not respond within 10 minutes (5 pings), the instance is determined to be unhealthy and our service will stop routing requests to it. It is highly recommended for production apps to utilize this feature and minimize any potential downtime caused due to a faulty instance.";
        const healthCheckEnabledTitle = "Health Check is enabled.";
        const healthCheckEnabledDescription = "Health Check feature is currently configured for this web app. This will help minimize potential downtime.";
        const healthCheckLearnMore: string = "https://github.com/projectkudu/kudu/wiki/Health-Check-%28Preview%29"

        const workerDistributionCriticalTitle: string = "Distritubting your web app accross multiple instances";
        const workerDistributionCriticalDescription: string = "The webapp is currently configured to run on only one instance. Since you have only one instance you can expect downtime because when the App Service platform is upgraded, the instance on which your web app is running will be upgraded. Therefore, your web app process will be restarted and will experience downtime. ";
        const workerDistributionWarningTitle: string = "Distritubting your web app accross multiple instances";
        const workerDistributionWarningDescription: string = "The webapp is currently configured to run on two instances.<br/><br/>Since you have only two instances you can expect a downtime of upto 50% because when the App Service platform is upgraded, the instance on which your web app is hosted will be upgraded. Therefore, your web app process will be restarted and may experience some downtime as each instance is restarted sequentially.";
        const workerDistributionSuccessTitle: string = "Distritubting your web app accross multiple instances";
        const workerDistributionSuccessDescription: string = "Great, your web app is running on more than two instances. This is optimal because instances in different upgrade domains will not be upgraded at the same time. While one worker instance is getting upgraded the other is still active to serve web requests.";
        const workerDistributionLearnMore: string = "https://docs.microsoft.com/en-us/azure/monitoring-and-diagnostics/insights-how-to-scale";

        const appDensityWarningorCriticalTitle: string = "App Service Plan hosts more than the recommended active sites";
        const appDensityCriticalDescription: string = "Apps that are a part of the same App Service Plan, compete for the same set of resources. Our data indicates that you have more than recommended number of sites running on your App Service Plan.";
        const appDensitySuccessTitle: string = "Total active sites on the App Service Plan are within the recommended value";
        const appDensitySuccessDescription: string = "Total active sites on the App Service Plan are within the recommended value. You are currently running recommended number of active app(s) within the App Service Plan.";
        const appDensityLearnMore: string = "https://docs.microsoft.com/en-us/azure/app-service/overview-hosting-plans";


        this._resourceService.getRiskAlertsResult().subscribe(results => {
            if (results) {
                let webconfig: any = results[0];
                let autoHealEnabled = webconfig.properties.autoHealEnabled;
                let healthCheckEnabled = webconfig.properties.healthCheckPath != null && webconfig.properties.healthCheckPath.toString() !== '' && webconfig.properties.healthCheckPath.toString().length >= 1;

                let autoHealDetail = autoHealEnabled ? new riskAlertDetail(MessageBarType.success, autoHealEnabledTitle, autoHealEnabledDescription, autoHealLearnMore) : new riskAlertDetail(MessageBarType.severeWarning, autoHealDisabledTitle, autoHealDisabledDescription, autoHealLearnMore);
                let healthCheckDetail = healthCheckEnabled ? new riskAlertDetail(MessageBarType.success, healthCheckEnabledTitle, healthCheckEnabledDescription, healthCheckLearnMore) : new riskAlertDetail(MessageBarType.severeWarning, healthCheckDisabledTitle, healthCheckDisabledDescription, autoHealLearnMore);

                // Worker distribution check
                let severfarmResource: any = results[1];
                let numberOfWorkers = severfarmResource.properties.currentNumberOfWorkers;
                let workDistributionCheckPassed = numberOfWorkers > 2;
                let workDistributionDetail = numberOfWorkers == 1 ? new riskAlertDetail(MessageBarType.severeWarning, workerDistributionCriticalTitle, workerDistributionCriticalDescription, workerDistributionLearnMore) : numberOfWorkers === 2 ? new riskAlertDetail(MessageBarType.warning, workerDistributionWarningTitle, workerDistributionWarningDescription, workerDistributionLearnMore) : new riskAlertDetail(MessageBarType.success, workerDistributionSuccessTitle, workerDistributionSuccessDescription, workerDistributionLearnMore);

                // App density check
                let numberOfSites = severfarmResource.properties.numberOfSites;
                let currentWorkerSize = severfarmResource.properties.currentWorkerSize;
                let appDensityStatus = MessageBarType.success;
                let appDensityDetailTitle = appDensitySuccessTitle;
                let appDensityDetailDescription = appDensitySuccessDescription;
                let currentWorkerString = "small";
                let currentPlanSoftLimit = ASPDensityLimit.SmallSoftLimit;
                let appDensityCheckPassed = false;

                switch (currentWorkerSize) {
                    // Small workers
                    case 0:
                        if (numberOfSites >= ASPDensityLimit.SmallLimit) {
                            appDensityStatus = MessageBarType.severeWarning;
                            appDensityDetailTitle = appDensityWarningorCriticalTitle;
                        }
                        else if (numberOfSites >= ASPDensityLimit.SmallSoftLimit) {
                            appDensityStatus = MessageBarType.warning;
                            appDensityDetailTitle = appDensityWarningorCriticalTitle;
                        }
                        else {
                            appDensityCheckPassed = true;
                        };
                        break;
                    // Medium workers
                    case 1:
                        currentWorkerString = "medium";
                        currentPlanSoftLimit = ASPDensityLimit.MediumSoftLimit;
                        if (numberOfSites >= ASPDensityLimit.MediumLimit) {
                            appDensityStatus = MessageBarType.severeWarning;
                            appDensityDetailTitle = appDensityWarningorCriticalTitle;
                        }
                        else if (numberOfSites >= ASPDensityLimit.MediumSoftLimit) {
                            appDensityStatus = MessageBarType.warning;
                            appDensityDetailTitle = appDensityWarningorCriticalTitle;
                        }
                        else {
                            appDensityCheckPassed = true;
                        };
                        break;
                    // Large workers
                    case 2:
                        currentWorkerString = "large";
                        currentPlanSoftLimit = ASPDensityLimit.LargeSoftLimit;
                        if (numberOfSites >= ASPDensityLimit.LargeLimit) {
                            appDensityStatus = MessageBarType.severeWarning;
                            appDensityDetailTitle = appDensityWarningorCriticalTitle;
                        }
                        else if (numberOfSites >= ASPDensityLimit.LargeSoftLimit) {
                            appDensityStatus = MessageBarType.warning;
                            appDensityDetailTitle = appDensityWarningorCriticalTitle;
                        }
                        else {
                            appDensityCheckPassed = true;
                        };
                        break;
                }

                let addDensityWarningorCriticalDescriptionPostfix = `We detected your app is running on a ${currentWorkerString} sized worker and the current App Service Plan,  on an average, is running ${numberOfSites} simultaneously active apps. Apps that are a part of the same App Service Plan, compete for the same set of resources. Our data indicates that ${currentPlanSoftLimit}+ active apps in an App Service Plan running on a ${currentWorkerString}sized worker deterioates apps performance. It causes CPU and memory contention resulting in availability and reliablity loss.`;
                if (appDensityStatus === MessageBarType.warning) {
                    appDensityDetailDescription = 'Your App Service Plan is nearing saturation.' + addDensityWarningorCriticalDescriptionPostfix;
                }
                else if (appDensityStatus === MessageBarType.severeWarning) {
                    appDensityDetailDescription = 'Your App Service Plan is currently saturated.' + addDensityWarningorCriticalDescriptionPostfix;
                }

                let appDensityCheckDetail = new riskAlertDetail(appDensityStatus, appDensityDetailTitle, appDensityDetailDescription, appDensityLearnMore);

                this.riskAlertChecksHealthy = autoHealEnabled && healthCheckEnabled && workDistributionCheckPassed && appDensityCheckPassed;

                this._authService.getStartupInfo().subscribe((startupInfo) => {
                    // For now, only showing alert in case submission when there is at least one risk check fails
                    this.showRiskAlertsNotification = (startupInfo.supportTopicId && startupInfo.supportTopicId != '' && !this.riskAlertChecksHealthy);
                  });

                var riskAlertCheckDetails = {
                    "riskAlertChecksHealthy": this.riskAlertChecksHealthy,
                    "autoHeal": autoHealDetail,
                    "healthCheck": healthCheckDetail,
                    "workerDistribution": workDistributionDetail,
                    "appDensity": appDensityCheckDetail
                };

                this.globals.updatereliabilityChecksDetails(riskAlertCheckDetails);
            }
        },e =>{
            this.globals.reliabilityChecksDetailsBehaviorSubject.error(e);
        });
    }

    openRiskAlertsPanel() {
        this.globals.openRiskAlertsPanel = true;
    }
}

export class riskAlertDetail {
    messageType: MessageBarType = MessageBarType.success;
    title: string = "";
    description: string = "";
    learnMore: string = "";
    expand: boolean = false;

    constructor(messageType: MessageBarType, title: string = "", description: string = "", learnMore: string = "", expand: boolean = false) {
        this.messageType = messageType;
        this.title = title;
        this.description = description;
        this.learnMore = learnMore;
        this.expand = this.messageType !== MessageBarType.info && this.messageType !== MessageBarType.success;
    }
}

export enum ASPDensityLimit {
    SmallSoftLimit = 8,
    SmallLimit = 10,
    MediumSoftLimit = 16,
    MediumLimit = 20,
    LargeSoftLimit = 32,
    LargeLimit = 40
}
