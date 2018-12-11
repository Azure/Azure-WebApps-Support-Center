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
    templateUrl: 'php-processanalyzer-tool.component.html',
    styleUrls: ['../styles/daasstyles.scss']
})
export class PhpProcessAnalyzerToolComponent extends DaasBaseComponent implements OnInit {

    title: string = "Collect a PHP Process and Thread report";
    description: string = "If your PHP Application is performing slow, you can run this tool to take a memory dump of the PHP processes and analyze PHP thread callstacks.";
    
    thingsToKnowBefore: string[] = [
        "A memory dump of all the PHP processes will be collected and this will pause the process for the duration the memory dump is being collected.",
        "If the PHP application is consuming a lot of memory, it will take longer time to take a dump and during this time the process cannot serve any active requests.",
        "After the analysis is component a report with all the PHP processes and their threads will be displayed.",    
        "This information is helpful only if your PHP application is performing slowly."
        

    ]
    
    constructor(private _siteServiceLocal: SiteService, private _daasServiceLocal: DaasService, private _windowServiceLocal: WindowService, private _loggerLocal: AvailabilityLoggingService)
    {
        super(_siteServiceLocal, _daasServiceLocal, _windowServiceLocal, _loggerLocal);
    }
    ngOnInit(): void {

        this.diagnoserName = "PHP Process Report";
        this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);

    }

    
}