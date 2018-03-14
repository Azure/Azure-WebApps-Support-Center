import { Component, Injector, Output, EventEmitter, OnInit, AfterViewInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { OperatingSystem, SiteExtensions, Site } from '../../../shared/models/site';
import { LoggingService } from '../../../shared/services/logging/logging.service';
import { SiteService } from '../../../shared/services/site.service';
import { CategoriesService } from '../../../shared/services/categories.service';
import { Category, Subcategory } from '../../../shared/models/problem-category';

@Component({
    templateUrl: 'main-menu.component.html',
    providers: [CategoriesService],
    styleUrls: [
        'main-menu.component.css'
    ]
})
export class MainMenuComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    problemCategories: Category[] = [];
    
    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();
    
    constructor(private _injector: Injector, private _router: Router, private _logger: LoggingService, 
        private _siteService: SiteService, private _categoryService: CategoriesService) {
    }

    ngOnInit(): void {

        this._siteService.currentSite.subscribe(site => {
            if (site) {
                this.problemCategories = this._categoryService.getCategories(site);

                setTimeout(() => {
                    this.onComplete.emit({ status: true });
                }, 300);
            }
        })
    }

    logCategorySelected(name: string) {
        this._logger.LogClickEvent(name, 'Home Page');
    }

    ngAfterViewInit(): void {
        this.onViewUpdate.emit();
    }    
}
