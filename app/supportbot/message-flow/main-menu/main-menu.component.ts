import { Component, Injector, Output, EventEmitter, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { LoggingService, SiteService } from '../../../shared/services';
import { OperatingSystem, SiteExtensions, Site } from '../../../shared/models/site';

@Component({
    templateUrl: 'main-menu.component.html'
})
export class MainMenuComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    categories: { name: string, href: string }[];
    colors: { text: string, background: string }[];

    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

    constructor(private _injector: Injector, private _router: Router, private _logger: LoggingService, private _siteService: SiteService) {
    }

    ngOnInit(): void {

        this._siteService.currentSite.subscribe(site => {
            if (site) {
                let categories: any[] = this._getCategories(site);
                var iterator = 0;
                this.categories = [];
        
                this._initializeColors();
        
                var interval = setInterval(() => {
                    if (iterator >= categories.length) {
                        clearInterval(interval);
        
                        setTimeout(() => {
                            this.onComplete.emit({ status: true });
                        }, 300);
        
                    }
                    else {
                        this.categories.push(categories[iterator]);
                    }
                    iterator++;
                }, 100);
            }
        })
    }

    ngAfterViewInit(): void {
        this.onViewUpdate.emit();
    }

    private _getCategories(site: Site): { name: string, href: string }[] {
        let categories: { name: string, href: string }[] = [];

        categories.push({
            name: 'Web App Down',
            href: 'availability/analysis'
        });

        categories.push({
            name: 'Web App Slow',
            href: 'performance/analysis'
        });

        if (SiteExtensions.operatingSystem(site) === OperatingSystem.linux) {
            categories.push({
                name: 'Container Initialization',
                href: 'availability/detectors/dockercontainerstartstop'
            });
        }
        else {
            categories.push({
                name: 'High CPU Usage',
                href: 'availability/detectors/sitecpuanalysis'
            });

            categories.push({
                name: 'High Memory Usage',
                href: 'availability/memoryanalysis'
            });

            categories.push({
                name: 'Web App Restarted',
                href: 'availability/apprestartanalysis'
            });

            categories.push({
                name: 'TCP Connections',
                href: 'availability/tcpconnectionsanalysis'
            });
        }

        return categories;
    }

    private _initializeColors() {
        this.colors = [{
            text: 'white',
            background: '#1446a0'
        }, {
            text: 'white',
            background: '#ef476f'
        }, {
            text: 'white',
            background: '#540d6e'
        }, {
            text: 'white',
            background: 'rgb(1, 185, 137)'
        }, {
            text: 'white',
            background: 'rgb(234, 131, 0)'
        }, {
            text: 'white',
            background: 'rgb(200, 0, 185)'
        }];
    }

    logCategorySelected(name: string) {
        this._logger.LogClickEvent(name, 'Home Page');
    }
}
