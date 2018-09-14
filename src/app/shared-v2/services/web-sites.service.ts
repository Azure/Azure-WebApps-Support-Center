import { Injectable } from '@angular/core';
import { ResourceService } from './resource.service';
import { AppAnalysisService } from '../../shared/services/appanalysis.service';
import { ArmService } from '../../shared/services/arm.service';
import { OperatingSystem, Site } from '../../shared/models/site';
import { AppType } from '../../shared/models/portal';
import { Sku } from '../../shared/models/server-farm';
import { IDiagnosticProperties } from '../../shared/models/diagnosticproperties';

@Injectable()
export class WebSitesService extends ResourceService {

    private _subscription;
    private _resourceGroup;
    private _siteName;
    private _slotName;

    public appStack: string = "";
    public platform: OperatingSystem = OperatingSystem.any;
    public appType: AppType = AppType.WebApp;
    public sku: Sku = Sku.All;

    constructor(protected _armService: ArmService, private _appAnalysisService: AppAnalysisService) {
        super(_armService);
    }

    protected makeWarmUpCalls() {
        super.makeWarmUpCalls();
        this._populateSiteInfo();
        this._appAnalysisService.makeWarmUpCallsForSite(this._subscription, this._resourceGroup, this._siteName, this._slotName);
    }

    private _populateSiteInfo(): void {
        let pieces = this.resource.id.toLowerCase().split('/');
        this._subscription = pieces[pieces.indexOf('subscriptions') + 1];
        this._resourceGroup = pieces[pieces.indexOf('resourcegroups') + 1];
        this._siteName = pieces[pieces.indexOf('sites') + 1];
        this._slotName = pieces.indexOf('slots') >= 0 ? pieces[pieces.indexOf('slots') + 1] : '';

        let site: Site = <Site>this.resource.properties;

        this._appAnalysisService.getDiagnosticProperties(this._subscription, this._resourceGroup, this._siteName, this._slotName).subscribe((data: IDiagnosticProperties) => {
            this.appStack = data && data.appStack && data.appStack != "" ? data.appStack : "";
        });

        this.appType = site.kind.toLowerCase().indexOf('functionapp') >= 0 ? AppType.FunctionApp : AppType.WebApp;
        this.platform = site.kind.toLowerCase().indexOf('linux') >= 0 ? OperatingSystem.linux : OperatingSystem.windows;
        this.sku = Sku[site.sku];
    }
}
