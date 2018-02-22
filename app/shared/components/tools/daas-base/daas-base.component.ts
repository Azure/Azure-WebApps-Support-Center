import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Session } from '../../../models/daas';
import { SiteService, DaasService, WindowService, AvailabilityLoggingService } from '../../../services';
import { SiteInfoMetaData } from '../../../models/site';

export abstract class DaasBaseComponent implements OnInit {

    DiagnoserName: string;
    siteToBeDiagnosed: SiteDaasInfo    
    scmPath: string;    

    Sessions: Session[];
    checkingExistingSessions: boolean;

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

    ngOnInit(): void {

        this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
    }

    updateCheckingExistingSessions(event) {
        this.checkingExistingSessions = event;
    }

    updateSessions(event) {
        this.Sessions = event;
    }
}