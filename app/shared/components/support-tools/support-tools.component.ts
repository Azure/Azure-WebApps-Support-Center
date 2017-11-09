import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PortalActionService, ArmService, PortalService, RBACService, LoggingService } from '../../services';
import { SupportBladeDefinitions } from '../../models/portal';
import { Site } from '../../models/site';
import { StartupInfo } from '../../models/portal';

@Component({
    selector: 'support-tools',
    templateUrl: 'support-tools.component.html'
})
export class SupportToolsComponent  {

    @Input() collapsed: boolean = false;

    public supportTools: any[];
    public premiumTools: any[];

    public mitigateLink: string;
    
    currentSite: Site;
    hasReadAccessToServerFarm: boolean;
    initialized: boolean = false;

    constructor(private _portalActionService: PortalActionService, private _armService: ArmService, private _portalService: PortalService, private _rbacService: RBACService, private _logger: LoggingService) {
        this.supportTools = [];
        this.premiumTools = [];

        this._portalService.getStartupInfo()        
            .flatMap((startUpInfo: StartupInfo) => {
                return this._armService.getResource<Site>(startUpInfo.resourceId);
            })
            .flatMap((site: Site) => {
                this.currentSite = site;
                return this._rbacService.hasPermission(this.currentSite.serverFarmId, [this._rbacService.readScope]);
            })
            .subscribe((hasPermission: boolean) => {
                this.hasReadAccessToServerFarm = hasPermission;
                this.initialize();
            })
    }

    initialize() {
        this.mitigateLink =  "https://mawssupport.trafficmanager.net/?sitename=" + this.currentSite.name + "&tab=mitigate&source=ibiza";

        this.supportTools.push({
            title: "Metrics per Instance (Apps)",
            description: "View Performance Counters as well as Metrics for your application",
            enabled: true,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.MetricPerInstance.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.MetricPerInstance)
            }
        });

        this.supportTools.push({
            title: "Metrics per Instance (App Service Plan)",
            description: this.hasReadAccessToServerFarm ? "View Metrics for applications on your App Service Plan" :
                "You do not have access to the the app service plan to which this site belongs",
            enabled: this.hasReadAccessToServerFarm,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.AppServicePlanMetrics.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.AppServicePlanMetrics)
            }
        });

        this.supportTools.push({
            title: "Live HTTP Traffic",
            description: "View Live Requests and Failures to your application",
            enabled: true,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.Pulse.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.Pulse)
            }
        });

         this.supportTools.push({
            title: "Application Events",
            description: "View Event Log which often holds information about failed requests",
            enabled: true,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.EventViewer.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.EventViewer)
            }
        });

        this.supportTools.push({
            title: "Failed Request Tracing Logs",
            description: "View detailed logs for failed requests. This requires you to enable Failed Request Tracing",
            enabled: true,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.FREBLogs.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.FREBLogs)
            }
        });

        this.supportTools.push({
            title: "Diagnostics as a Service",
            description: "Run a Diagnostics as a Service session for a deep analysis of your application",
            enabled: true,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.DaaS.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.DaaS)
            }
        });

        this.supportTools.push({
            title: "Mitigate",
            description: "Set rules for recycling or taking other actions based on memory usage or request patterns",
            enabled: true,
            action: () => { 
                this.logToolUse("Mitigate");
                this._portalActionService.openAutoHealSite();
            }
        });

        this.supportTools.push({
            title: "Advanced Application Restart",
            description: "Restart your app on a specific instance",
            enabled: true,
            action: () => { 
                this.logToolUse("AdvancedAppRestart");
                this._portalActionService.openBladeAdvancedAppRestartBladeForCurrentSite();
            }
        });

        this.premiumTools.push({
            title: "PHP Debugging",
            description: "",
            enabled: true,
            action: () => { 
                this.logToolUse("PHPDebugging", "Premium Tools");
                this._portalActionService.openPHPDebuggingBlade();
            }
        });

        this.premiumTools.push({
            title: "Security Scanning",
            description: "",
            enabled: true,
            action: () => { 
                this.logToolUse("TinfoilSecurity", "Premium Tools");
                this._portalActionService.openTifoilSecurityBlade();
            }
        });

        this.initialized = true;
    }

    logToolUse(tool: string, container = "Support Tools"): void{
        this._logger.LogClickEvent(tool, container);
    }
}