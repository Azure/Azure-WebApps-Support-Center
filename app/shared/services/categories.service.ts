import { Injectable } from '@angular/core';
import { Subcategory, Category } from '../models/problem-category';
import * as _ from 'underscore';
import { OperatingSystem, Site, SiteExtensions } from '../models/site';
import { operators } from 'rxjs';

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
            OperatingSystem: OperatingSystem.windows || OperatingSystem.linux
        });

        perf.Subcategories.push({
            Name: 'Web App Slow',
            BgColor: '#ef476f',
            TextColor: 'White',
            Href: 'performance/analysis',
            OperatingSystem: OperatingSystem.windows || OperatingSystem.linux
        });

        perf.Subcategories.push({
            Name: 'High CPU Usage',
            BgColor: '#540d6e',
            TextColor: 'White',
            Href: 'availability/detectors/sitecpuanalysis',
            OperatingSystem: OperatingSystem.windows
        });

        perf.Subcategories.push({
            Name: 'High Memory Usage',
            BgColor: 'rgb(1, 185, 137)',
            TextColor: 'White',
            Href: 'availability/memoryanalysis',
            OperatingSystem: OperatingSystem.windows
        });

        perf.Subcategories.push({
            Name: 'Container Initialization',
            BgColor: '#540d6e',
            TextColor: 'White',
            Href: 'availability/detectors/dockercontainerstartstop',
            OperatingSystem: OperatingSystem.linux
        });
        
        
        let monitor = new Category();
        monitor.Name = "Monitor";
        monitor.Subcategories = [];

        monitor.Subcategories.push({
            Name: 'Web App Restarted',
            BgColor: 'rgb(234, 131, 0)',
            TextColor: 'White',
            Href: 'availability/apprestartanalysis',
            OperatingSystem: OperatingSystem.windows
        });

        monitor.Subcategories.push({
            Name: 'TCP Connections',
            BgColor: 'rgb(59, 99, 123)',
            TextColor: 'White',
            Href: 'availability/tcpconnectionsanalysis',
            OperatingSystem: OperatingSystem.windows
        });

        let tools = new Category();
        tools.Name = "Diagnostic Tools";
        tools.Subcategories = [];

        tools.Subcategories.push({
            Name: 'CLR Profiling Tool',
            BgColor: 'rgb(153, 51, 0)',
            TextColor: 'White',
            Href: '',
            OperatingSystem: OperatingSystem.windows
        });

        tools.Subcategories.push({
            Name: 'Database Tester',
            BgColor: 'rgb(102, 153, 0)',
            TextColor: 'White',
            Href: '',
            OperatingSystem: OperatingSystem.windows
        });

        tools.Subcategories.push({
            Name: 'Client Cert Checker',
            BgColor: 'rgb(0, 102, 153)',
            TextColor: 'White',
            Href: '',
            OperatingSystem: OperatingSystem.windows
        });
        
        this.Categories.push(perf);
        this.Categories.push(monitor);

        // will comment this before merge
        this.Categories.push(tools);
    }

    getCategories(site: Site): Category[] {

        let categories : Category[] = [];
        let subcategories : Subcategory[] = [];

        this.Categories.forEach( c=> {

            subcategories = c.Subcategories.filter(x => x.OperatingSystem === SiteExtensions.operatingSystem(site));

            if (subcategories.length > 0)
            {
                // willing to hear suggestions to improve
                // this logic, this seems a bit bad 

                let category = new Category();
                category.Name = c.Name;
                category.Collapsed = c.Collapsed;
                category.Subcategories = subcategories;
                categories.push(category);
            }

        })

        return categories;
    }
}