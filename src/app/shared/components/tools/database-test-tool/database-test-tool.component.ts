import { Component, Input, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Session, DatabaseTestConnectionResult } from '../../../models/daas';

import { SiteInfoMetaData } from '../../../models/site';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from '../../../services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';


@Component({
    templateUrl: 'database-test-tool.component.html',
    styleUrls: ['database-test-tool.component.css']
})
export class DatabaseTestToolComponent implements OnInit {

    siteToBeDiagnosed: SiteInfoMetaData
    dbTestResult: DatabaseTestConnectionResult[];
    error: any;
    retrievingInfo: boolean = true;

    constructor(private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService) {

        this._siteService.currentSiteMetaData.subscribe(siteInfo => {
            if (siteInfo) {

                let siteInfoMetaData = siteInfo;
                this.siteToBeDiagnosed = new SiteDaasInfo();

                this.siteToBeDiagnosed.subscriptionId = siteInfo.subscriptionId;
                this.siteToBeDiagnosed.resourceGroupName = siteInfo.resourceGroupName;
                this.siteToBeDiagnosed.siteName = siteInfo.siteName;
                this.siteToBeDiagnosed.slot = siteInfo.slot;               
            }
        });
    }
    

    ngOnInit(): void {
       
        this._daasService.getDatabaseTest(this.siteToBeDiagnosed)
        .subscribe(result => {
            this.retrievingInfo = false;
            this.dbTestResult = result;
        },
        error => {
            this.retrievingInfo = false;
            this.error = error;
        });
    }


}