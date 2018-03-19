import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Session } from '../../../models/daas';
import { SiteInfoMetaData } from '../../../models/site';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from '../../../services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';

export abstract class DaasBaseComponent  {

    DiagnoserName: string;
    siteToBeDiagnosed: SiteDaasInfo    
    scmPath: string;    
    refreshSessions:boolean = false;

    constructor(private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService) {

        this._siteService.currentSiteMetaData.subscribe(siteInfo => {
            if (siteInfo) {
                
                let siteInfoMetaData = siteInfo;
                this.siteToBeDiagnosed = new SiteDaasInfo();
                
                this.siteToBeDiagnosed.subscriptionId = siteInfo.subscriptionId;
                this.siteToBeDiagnosed.resourceGroupName =siteInfo.resourceGroupName;
                this.siteToBeDiagnosed.siteName = siteInfo.siteName;
                this.siteToBeDiagnosed.slot =siteInfo.slot;
                this.siteToBeDiagnosed.instances = [];

            }
        });
    }
        
    updateSessions(event) {
        this.refreshSessions = event;
    }
}