import { Component, Input, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Session, DatabaseTestConnectionResult } from '../../../models/daas';
import { SiteInfoMetaData } from '../../../models/site';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from '../../../services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';

@Component({
    templateUrl: 'connection-diagnoser-tool.component.html',
    styleUrls: ['connection-diagnoser-tool.component.css']
})
export class ConnectionDiagnoserToolComponent implements OnInit {

    siteToBeDiagnosed: SiteInfoMetaData
    dbTestResult: DatabaseTestConnectionResult[];
    error: any;
    retrievingInfo: boolean = true;
    succeeded: number = 0;
    total: number = 0;

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

                result.forEach( (x)=>{
                    if (x.Succeeded)
                    {
                        this.succeeded++;
                    }
                    if (x.ConnectionString.toLowerCase().indexOf('defaultendpointsprotocol') === -1)
                    {
                        this.total++;
                    }
                   
                    if (x.FilePath !==null && x.FilePath.startsWith('D:\\local\\VirtualDirectory0'))
                    {
                        x.FilePath = x.FilePath.substring(27);
                    }

                });

                this.dbTestResult = result.sort(function (x, y) {
                    return (x.Succeeded === y.Succeeded) ? 0 : x ? 1 : -1;
                });
            },
            error => {
                this.retrievingInfo = false;
                this.error = error;
            });
    }

    toggleExpanded(i:number): void {
        //TODO: Add logging for clicks here
        this.dbTestResult[i].Expanded = !this.dbTestResult[i].Expanded;       
    }

    toggleConnectionString(i:number): void {
        this.dbTestResult[i].DisplayClearText = !this.dbTestResult[i].DisplayClearText;
    }

}