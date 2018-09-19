import { Injectable } from '@angular/core';
import { Subcategory, Category } from '../models/problem-category';
import * as _ from 'underscore';
import { OperatingSystem, Site, SiteExtensions } from '../models/site';
import { operators, BehaviorSubject } from 'rxjs/Rx';
import { ToolNames } from '../models/tools-constants';
import { GenericApiService } from './generic-api.service';
import { AuthService } from '../../startup/services/auth.service';
import { ResourceType, AppType } from '../models/portal';
import { DetectorResponse, DetectorMetaData } from 'applens-diagnostics/src/app/diagnostic-data/models/detector';
import { Observable } from 'rxjs/Observable';
import { DemoSubscriptions } from '../../betaSubscriptions';
import { SiteService } from './site.service';
import { Sku } from '../models/server-farm';

@Injectable()
export class CategoriesService {

    private _categories: Category[] = [];

    public Categories: BehaviorSubject<Category[]> = new BehaviorSubject<Category[]>([]);

    appType: AppType = AppType.WebApp;

    constructor(private _genericApiService: GenericApiService, private _authService: AuthService, private _siteService: SiteService) {
        this._authService.getStartupInfo().subscribe(info => {
            if (info.resourceType == ResourceType.Site) {
                //TODO: filter for functions
                this.initCategoriesAndSubcategories();

                this._siteService.currentSite.subscribe(site => {
                    if (site) {
                        this.appType = site.appType;
                    }
                });
            }

            this._genericApiService.getDetectors().subscribe(resp => {
                this.addGenericDetectors(resp, info.resourceId);
                this.Categories.next(this._categories);
            });
        })

        this.Categories.next(this._categories);
    }

    addGenericDetectors(detectors: DetectorMetaData[], resourceId: string): void {
        let generic = <Category>{
            Name: this._authService.resourceType === ResourceType.Site ? (this.appType === AppType.WebApp ? 'Management and Configuration' : "Function App") : 'App Service Environment',
            Collapsed: false,
            BgColor: 'rgb(1, 185, 137)',
            TextColor: 'white',
            Subcategories: detectors
            //TODO: below line is temporary to remove linux detectors that we are hardcoding to be in avail + perf section
            .filter(detector => detector.id.toLowerCase() !== 'linuxappdown' && detector.id.toLowerCase() !== 'linuxcontainerrecycle') 
            .map(detector => <Subcategory>{
                Name: detector.name,
                BgColor: '#1446a0',
                TextColor: 'White',
                Href:  `${resourceId}/detectors/${detector.id}`,
                OperatingSystem: OperatingSystem.any,
                AppStack: "",
                AppType: AppType.WebApp | AppType.FunctionApp,
                Sku: Sku.All
            })
        }

        this._categories.push(generic);
    }

    initCategoriesAndSubcategories(): void {

        let perf = new Category();
        perf.Name = "Availability & Performance";
        perf.Collapsed = false;
        perf.Subcategories = [];
        perf.BgColor = "rgb(20, 70, 160)";
        perf.TextColor = "white";

        perf.Subcategories.push({
            Name: 'Web App Down',
            BgColor: '#1446a0',
            TextColor: 'White',
            Href: 'availability/analysis',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'Web App Down',
            BgColor: '#1446a0',
            TextColor: 'White',
            Href: '../detectors/LinuxAppDown',
            OperatingSystem: OperatingSystem.linux,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'Web App Slow',
            BgColor: '#ef476f',
            TextColor: 'White',
            Href: 'performance/analysis',
            OperatingSystem: OperatingSystem.windows | OperatingSystem.linux,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'High CPU Usage',
            BgColor: '#540d6e',
            TextColor: 'White',
            Href: 'availability/detectors/sitecpuanalysis',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'High Memory Usage',
            BgColor: 'rgb(1, 185, 137)',
            TextColor: 'White',
            Href: 'availability/memoryanalysis',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'Web App Restarted',
            BgColor: 'rgb(234, 131, 0)',
            TextColor: 'White',
            Href: 'availability/apprestartanalysis',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'Web App Restarted',
            BgColor: 'rgb(234, 131, 0)',
            TextColor: 'White',
            Href: '../detectors/LinuxContainerRecycle',
            OperatingSystem: OperatingSystem.linux,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'TCP Connections',
            BgColor: 'rgb(59, 99, 123)',
            TextColor: 'White',
            Href: 'availability/tcpconnectionsanalysis',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp | AppType.FunctionApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        let tools = new Category();
        tools.Name = "Diagnostic Tools";
        tools.Subcategories = [];
        tools.Collapsed = false;
        tools.BgColor = "rgb(153, 51, 127)";
        tools.TextColor = "white";

        tools.Subcategories.push({
            Name: ToolNames.Profiler,
            BgColor: 'rgb(153, 51, 0)',
            TextColor: 'White',
            Href: 'tools/profiler',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : "ASP.Net"
        });

        tools.Subcategories.push({
            Name: ToolNames.MemoryDump,
            BgColor: 'rgb(102, 153, 0)',
            TextColor: 'White',
            Href: 'tools/memorydump',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        tools.Subcategories.push({
            Name: ToolNames.DatabaseTester,
            BgColor: 'rgb(0, 102, 153)',
            TextColor: 'White',
            Href: 'tools/databasetester',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        tools.Subcategories.push({
            Name: ToolNames.NetworkTrace,
            BgColor: 'rgb(153, 51, 127)',
            TextColor: 'White',
            Href: 'tools/networktrace',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : ""
        });

        tools.Subcategories.push({
            Name: ToolNames.PHPLogAnalyzer,
            BgColor: 'rgb(153, 69, 0)',
            TextColor: 'White',
            Href: 'tools/phploganalyzer',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : "PHP"
        });
        
        tools.Subcategories.push({
            Name: ToolNames.PHPProcessAnalyzer,
            BgColor: 'rgb(0, 148, 153)',
            TextColor: 'White',
            Href: 'tools/phpprocessanalyzer',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : "PHP"
        });

        tools.Subcategories.push({
            Name: ToolNames.JavaMemoryDump,
            BgColor: 'rgb(153, 69, 0)',
            TextColor: 'White',
            Href: 'tools/javamemorydump',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : "Java"
        });

        tools.Subcategories.push({
            Name: ToolNames.JavaThreadDump,
            BgColor: 'rgb(0, 148, 153)',
            TextColor: 'White',
            Href: 'tools/javathreaddump',
            OperatingSystem: OperatingSystem.windows,
            AppType: AppType.WebApp,
            Sku: Sku.NotDynamic,
            AppStack : "Java"
        });
        
        this._categories.push(perf);
        this._categories.push(tools);
    }
}