import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BladeOptions, SupportBladeDefinitions } from '../../models/portal';
import 'rxjs/add/operator/map';
import { PortalService } from '../../../startup/services/portal.service';
import { PortalActionService } from '../../services/portal-action.service';

@Component({
    selector: 'default-solutions',
    templateUrl: 'default-solutions.component.html',
    styleUrls: ['default-solutions.component.css']
})
export class DefaultSolutionsComponent  {
    showSolutions: boolean = false;
    bladeOptions: BladeOptions;
    

    constructor(private _portalService: PortalService, private _portalActionService : PortalActionService) {
        this.bladeOptions = BladeOptions;
    }

     openBlade(supportOption: string) {

        switch (supportOption) {
            case BladeOptions.appserviceplanmetrics:
                this._portalActionService.openSupportIFrame( SupportBladeDefinitions.AppServicePlanMetrics);
                break;
            case BladeOptions.pulse:
                this._portalActionService.openSupportIFrame( SupportBladeDefinitions.Pulse);
                break;
            case BladeOptions.eventviewer:
                this._portalActionService.openSupportIFrame( SupportBladeDefinitions.EventViewer);
                break;
            case BladeOptions.freblogs:
                this._portalActionService.openSupportIFrame( SupportBladeDefinitions.FREBLogs);
                break;
            case BladeOptions.sitemetrics:
                this._portalActionService.openSupportIFrame( SupportBladeDefinitions.MetricPerInstance);
                break;
            case BladeOptions.diagnostics:
                this._portalActionService.openSupportIFrame( SupportBladeDefinitions.DaaS);
                break;
            case BladeOptions.scaleUp:
                this._portalActionService.openBladeScaleUpBlade();
                break;
            case BladeOptions.scaleOut:
                this._portalActionService.openBladeScaleOutBlade();
                break;
            case BladeOptions.advancedAppRestartBlade:
                this._portalActionService.openBladeAdvancedAppRestartBlade([{ resourceUri: this._portalActionService.currentSite.id, siteName: this._portalActionService.currentSite.name }], []);
                break;
        }

        let supportOptionInfo =  { resourceUri: this._portalActionService.currentSite.id, blade: supportOption };
        this._portalService.logAction("SupportCenter:", "CommonSolutions-OpenBlade", supportOptionInfo);
       
    }

    logLinkClick(link: string){
        this._portalService.logAction("SupportCenter:", "CommonSolutions-OpenLink", { link: link});
    }

}
