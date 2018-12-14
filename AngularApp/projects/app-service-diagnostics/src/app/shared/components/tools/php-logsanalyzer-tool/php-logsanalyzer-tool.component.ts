import { Component, Input, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Session } from '../../../models/daas';
import { SiteInfoMetaData } from '../../../models/site';
import { DaasBaseComponent } from '../daas-base/daas-base.component';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from '../../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';

@Component({
    templateUrl: 'php-logsanalyzer-tool.component.html',
    styleUrls: ['../styles/daasstyles.scss']
})
export class PhpLogsAnalyzerToolComponent extends DaasBaseComponent implements OnInit {

    title: string = 'Collect and Analyze PHP error logs';
    description: string = 'This tool analyzes PHP logs for your App and generates a report filtering out errors and warnings.';

    thingsToKnowBefore: string[] = [
        'It will only work if PHP Logging is enabled for your Web App.',
        'Your Web App will not be restarted while running this tool.'

    ];

    constructor(private _siteServiceLocal: SiteService, private _daasServiceLocal: DaasService, private _windowServiceLocal: WindowService, private _loggerLocal: AvailabilityLoggingService) {
        super(_siteServiceLocal, _daasServiceLocal, _windowServiceLocal, _loggerLocal);
    }
    ngOnInit(): void {

        this.diagnoserName = 'PHP Error Logs';
        this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);

    }


}
