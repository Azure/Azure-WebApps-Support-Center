import { Injectable } from '@angular/core';
import { Subcategory, Category } from '../models/problem-category';
import * as _ from 'underscore';
import { OperatingSystem, Site, SiteExtensions } from '../models/site';
import { operators } from 'rxjs';
import { ToolNames } from '../models/tools-constants';

@Injectable()
export class CategoriesService {

    private Categories: Category[] = [];

    constructor() {
        this.intCategoriesAndSubcategories();
    }

    intCategoriesAndSubcategories(): void {

        let perf = new Category();
        perf.Name = "Availability & Performance";
        perf.Collapsed = false;
        perf.Subcategories = [];

        perf.Subcategories.push({
            Name: 'Web App Down',
            BgColor: '#1446a0',
            TextColor: 'White',
            Href: 'availability/analysis',
            OperatingSystem: OperatingSystem.windows | OperatingSystem.linux,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'Web App Slow',
            BgColor: '#ef476f',
            TextColor: 'White',
            Href: 'performance/analysis',
            OperatingSystem: OperatingSystem.windows | OperatingSystem.linux,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'High CPU Usage',
            BgColor: '#540d6e',
            TextColor: 'White',
            Href: 'availability/detectors/sitecpuanalysis',
            OperatingSystem: OperatingSystem.windows,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'High Memory Usage',
            BgColor: 'rgb(1, 185, 137)',
            TextColor: 'White',
            Href: 'availability/memoryanalysis',
            OperatingSystem: OperatingSystem.windows,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'Container Initialization',
            BgColor: '#540d6e',
            TextColor: 'White',
            Href: 'availability/detectors/dockercontainerstartstop',
            OperatingSystem: OperatingSystem.linux,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'Web App Restarted',
            BgColor: 'rgb(234, 131, 0)',
            TextColor: 'White',
            Href: 'availability/apprestartanalysis',
            OperatingSystem: OperatingSystem.windows,
            AppStack : ""
        });

        perf.Subcategories.push({
            Name: 'TCP Connections',
            BgColor: 'rgb(59, 99, 123)',
            TextColor: 'White',
            Href: 'availability/tcpconnectionsanalysis',
            OperatingSystem: OperatingSystem.windows,
            AppStack : ""
        });

        let tools = new Category();
        tools.Name = "Diagnostic Tools";
        tools.Subcategories = [];
        tools.Collapsed = false;

        tools.Subcategories.push({
            Name: ToolNames.Profiler,
            BgColor: 'rgb(153, 51, 0)',
            TextColor: 'White',
            Href: 'tools/profiler',
            OperatingSystem: OperatingSystem.windows,
            AppStack : "ASP.Net"
        });

        tools.Subcategories.push({
            Name: ToolNames.MemoryDump,
            BgColor: 'rgb(102, 153, 0)',
            TextColor: 'White',
            Href: 'tools/memorydump',
            OperatingSystem: OperatingSystem.windows,
            AppStack : ""
        });

        tools.Subcategories.push({
            Name: ToolNames.DatabaseTester,
            BgColor: 'rgb(0, 102, 153)',
            TextColor: 'White',
            Href: 'tools/databasetester',
            OperatingSystem: OperatingSystem.windows,
            AppStack : ""
        });

        tools.Subcategories.push({
            Name: ToolNames.NetworkTrace,
            BgColor: 'rgb(153, 51, 127)',
            TextColor: 'White',
            Href: 'tools/networktrace',
            OperatingSystem: OperatingSystem.windows,
            AppStack : ""
        });

        tools.Subcategories.push({
            Name: ToolNames.PHPLogAnalyzer,
            BgColor: 'rgb(153, 69, 0)',
            TextColor: 'White',
            Href: 'tools/phploganalyzer',
            OperatingSystem: OperatingSystem.windows,
            AppStack : "PHP"
        });
        
        tools.Subcategories.push({
            Name: ToolNames.PHPProcessAnalyzer,
            BgColor: 'rgb(0, 148, 153)',
            TextColor: 'White',
            Href: 'tools/phpprocessanalyzer',
            OperatingSystem: OperatingSystem.windows,
            AppStack : "PHP"
        });

        tools.Subcategories.push({
            Name: ToolNames.JavaMemoryDump,
            BgColor: 'rgb(153, 69, 0)',
            TextColor: 'White',
            Href: 'tools/javamemorydump',
            OperatingSystem: OperatingSystem.windows,
            AppStack : "Java"
        });

        tools.Subcategories.push({
            Name: ToolNames.JavaThreadDump,
            BgColor: 'rgb(0, 148, 153)',
            TextColor: 'White',
            Href: 'tools/javathreaddump',
            OperatingSystem: OperatingSystem.windows,
            AppStack : "Java"
        });

        
        this.Categories.push(perf);
        this.Categories.push(tools);
    }

    getCategories(site: Site): Category[] {
        return this.Categories;
    }
}