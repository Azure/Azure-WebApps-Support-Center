import { Component, Input, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { Session } from '../../../models/daas';
import { SiteInfoMetaData } from '../../../models/site';
import { DaasBaseComponent } from '../daas-base/daas-base.component';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from '../../../services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';

@Component({
    templateUrl: 'java-memorydump-tool.component.html',
    styleUrls: ['../styles/daasstyles.css']
})
export class JavaMemoryDumpToolComponent extends DaasBaseComponent implements OnInit {

    title: string = "Collect a Java Memory dump";
    description: string = "If your Java app is consuming lot of memory, you can collect a Java Memory dump to identify the types responsible for high memory consumption.";
    
    thingsToKnowBefore: string[] = [
        "Java memory dumps are collected using the jMap utility.",
        "Collecting a jMap memory dump will freeze the process until the memory dump is collected so process cannot serve any requests during this time.",
        "jMap takes a signinficantly long time (in matter of minutes) to dump the JVM heap and this time can go significantly high if the memory consumption is high.",
        "Memory dumps are collected for all the Java process (java.exe) running on the instance.",        
        "Your App will not be restarted as a result of collecting the Java Memory dump"
    ]
    
    constructor(private _siteServiceLocal: SiteService, private _daasServiceLocal: DaasService, private _windowServiceLocal: WindowService, private _loggerLocal: AvailabilityLoggingService)
    {
        super(_siteServiceLocal, _daasServiceLocal, _windowServiceLocal, _loggerLocal);
    }
    ngOnInit(): void {

        this.diagnoserName = "JAVA Memory Dump";
        this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);

    }

    
}