import { Component, Input, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Session, DatabaseTestConnectionResult, ConnectionDatabaseType } from '../../../models/daas';
import { SiteInfoMetaData } from '../../../models/site';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from '../../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';

@Component({
    templateUrl: 'connection-diagnoser-tool.component.html',
    styleUrls: ['../styles/daasstyles.scss', 'connection-diagnoser-tool.component.scss']
})
export class ConnectionDiagnoserToolComponent implements OnInit {

    siteToBeDiagnosed: SiteInfoMetaData;
    dbTestResult: DatabaseTestConnectionResult[];
    error: any;
    retrievingInfo: boolean = true;
    succeeded: number = 0;
    total: number = 0;

    constructor(private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService) {

        this._siteService.currentSiteMetaData.subscribe(siteInfo => {
            if (siteInfo) {
                this.siteToBeDiagnosed = siteInfo;
            }
        });
    }

    ngOnInit(): void {
        this.checkConnectionStrings();
    }

    checkConnectionStrings() {
        this.retrievingInfo = true;
        this.dbTestResult = [];

        this._logger.LogClickEvent('Check Connection Strings', 'DiagnosticTools');

        this._daasService.getDatabaseTest(this.siteToBeDiagnosed)
            .subscribe(result => {
                this.retrievingInfo = false;

                result.forEach((x) => {
                    if (x.Succeeded) {
                        this.succeeded++;
                    }

                    this.total++;

                    if (x.FilePath !== null && x.FilePath.startsWith('D:\\local\\VirtualDirectory0')) {
                        x.FilePath = x.FilePath.substring(27);
                    }

                });

                this.dbTestResult = result.sort(function (x, y) {
                    return (x.Succeeded === y.Succeeded) ? 0 : x ? 1 : -1;
                });

                this._logger.LogMessage(`TotalConnections=${this.total};Suceeded=${this.succeeded}`, 'DiagnosticTools');
            },
                error => {
                    this.retrievingInfo = false;
                    this.error = error;
                });
    }

    toggleExpanded(i: number): void {
        this._logger.LogClickEvent(`Connection String-${this.dbTestResult[i].Name}`, 'DiagnosticTools');
        this.dbTestResult[i].Expanded = !this.dbTestResult[i].Expanded;
    }

    toggleConnectionString(i: number): void {
        this.dbTestResult[i].DisplayClearText = !this.dbTestResult[i].DisplayClearText;
    }

    getDatabaseTypeName(conn: DatabaseTestConnectionResult): string {
        if (conn.FilePath !== null) {
            return 'Config file';
        } else {
            return ConnectionDatabaseType[conn.DatabaseType];
        }
    }

    isDatabaseTypeSupported(conn: DatabaseTestConnectionResult): boolean {
        return conn.DatabaseType !== ConnectionDatabaseType.NotSupported;
    }
}
