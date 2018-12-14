import { mergeMap } from 'rxjs/operators';
import { Component, Input } from '@angular/core';
import { SupportBladeDefinitions, ResourceType } from '../../models/portal';
import { Site, SiteExtensions, OperatingSystem } from '../../models/site';
import { StartupInfo } from '../../models/portal';
import { ResponseMessageEnvelope } from '../../models/responsemessageenvelope';
import { PortalActionService } from '../../services/portal-action.service';
import { ArmService } from '../../services/arm.service';
import { AuthService } from '../../../startup/services/auth.service';
import { RBACService } from '../../services/rbac.service';
import { LoggingService } from '../../services/logging/logging.service';

@Component({
    selector: 'support-tools',
    templateUrl: 'support-tools.component.html'
})
export class SupportToolsComponent {

    @Input() collapsed: boolean = false;

    public supportTools: any[];
    public premiumTools: any[];

    public mitigateLink: string;
    public diagnosticsLink: string;

    currentSite: Site;
    hasReadAccessToServerFarm: boolean;
    initialized: boolean = false;

    constructor(private _portalActionService: PortalActionService, private _armService: ArmService, private _authService: AuthService, private _rbacService: RBACService, private _logger: LoggingService) {
        this.supportTools = [];
        this.premiumTools = [];

        this._authService.getStartupInfo()
            .subscribe((startUpInfo: StartupInfo) => {
                if (startUpInfo.resourceType === ResourceType.Site) {
                    this._armService.getResource<Site>(startUpInfo.resourceId).pipe(
                        mergeMap((site: ResponseMessageEnvelope<Site>) => {
                            this.currentSite = site.properties;
                            return this._rbacService.hasPermission(this.currentSite.serverFarmId, [this._rbacService.readScope]);
                        }))
                        .subscribe((hasPermission: boolean) => {
                            this.hasReadAccessToServerFarm = hasPermission;
                            //disable for Linux

                            if (SiteExtensions.operatingSystem(this.currentSite) === OperatingSystem.windows) {
                                this.initialize();
                            }
                        });
                }
            });
    }

    initialize() {
        this.mitigateLink = 'tools/mitigate';
        this.diagnosticsLink = 'tools/daas';

        this.supportTools.push({
            title: 'Metrics per Instance (Apps)',
            description: 'View Performance Counters as well as Metrics for your application',
            enabled: true,
            action: () => {
                this.logToolUse(SupportBladeDefinitions.MetricPerInstance.Identifier);
                this._portalActionService.openMdmMetricsV3Blade();
            }
        });

        this.supportTools.push({
            title: 'Performance Counters',
            description: '',
            enabled: true,
            action: () => {
                this.logToolUse(SupportBladeDefinitions.MetricPerInstance.Identifier);
                this._portalActionService.openMdmMetricsBlade();
            }
        });

        this.supportTools.push({
            title: 'Metrics per Instance (App Service Plan)',
            description: this.hasReadAccessToServerFarm ? 'View Metrics for applications on your App Service Plan' :
                'You do not have access to the the app service plan to which this site belongs',
            enabled: this.hasReadAccessToServerFarm,
            action: () => {
                this.logToolUse(SupportBladeDefinitions.AppServicePlanMetrics.Identifier);
                this._portalActionService.openMdmMetricsV3Blade(this._portalActionService.currentSite.properties.serverFarmId);
            }
        });

        this.supportTools.push({
            title: 'Application Events',
            description: 'View Event Log which often holds information about failed requests',
            enabled: true,
            action: () => {
                this.logToolUse(SupportBladeDefinitions.EventViewer.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.EventViewer);
            }
        });

        this.supportTools.push({
            title: 'Failed Request Tracing Logs',
            description: 'View detailed logs for failed requests. This requires you to enable Failed Request Tracing',
            enabled: true,
            action: () => {
                this.logToolUse(SupportBladeDefinitions.FREBLogs.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.FREBLogs);
            }
        });

        this.supportTools.push({
            title: 'Advanced Application Restart',
            description: 'Restart your app on a specific instance',
            enabled: true,
            action: () => {
                this.logToolUse('AdvancedAppRestart');
                this._portalActionService.openBladeAdvancedAppRestartBladeForCurrentSite();
            }
        });

        this.premiumTools.push({
            title: 'PHP Debugging',
            description: '',
            enabled: true,
            action: () => {
                this.logToolUse('PHPDebugging', 'Premium Tools');
                this._portalActionService.openPHPDebuggingBlade();
            }
        });

        this.premiumTools.push({
            title: 'Security Scanning',
            description: '',
            enabled: true,
            action: () => {
                this.logToolUse('TinfoilSecurity', 'Premium Tools');
                this._portalActionService.openTifoilSecurityBlade();
            }
        });

        this.initialized = true;
    }

    logToolUse(tool: string, container = 'Support Tools'): void {
        this._logger.LogClickEvent(tool, container);
    }
}
