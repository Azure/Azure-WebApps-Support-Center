import { Component, Injector, Output, EventEmitter, OnInit, AfterViewInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { OperatingSystem, SiteExtensions, Site } from '../../../shared/models/site';
import { LoggingService } from '../../../shared/services/logging/logging.service';
import { SiteService } from '../../../shared/services/site.service';
import { CategoriesService } from '../../../shared/services/categories.service';
import { Category, Subcategory } from '../../../shared/models/problem-category';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { AuthService } from '../../../shared/services/auth.service';
import { StartupInfo } from '../../../shared/models/portal';

@Component({
    templateUrl: 'main-menu.component.html',
    providers: [CategoriesService],
    styleUrls: [
        'main-menu.component.css'
    ]
})
export class MainMenuComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    problemCategories: Category[] = [];
    allProblemCategories: Category[] = [];
    AppStack: string = "";    
    animateToolsOnly: boolean = false;
    showToolsDropdown:boolean = false;

    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

    constructor(private _injector: Injector, private _router: Router, private _logger: LoggingService,
        private _siteService: SiteService, private _categoryService: CategoriesService,
        private _authService: AuthService, private _appAnalysisService: AppAnalysisService) {

    }

    ngOnInit(): void {

        this._siteService.currentSite.subscribe(site => {
            if (site) {
                this.allProblemCategories = this._categoryService.getCategories(site);
                this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
                    let resourceUriParts = this._siteService.parseResourceUri(startupInfo.resourceId);
                    this._appAnalysisService.getDiagnosticProperties(resourceUriParts.subscriptionId, resourceUriParts.resourceGroup, resourceUriParts.siteName, resourceUriParts.slotName).subscribe(data => {
                        this.AppStack = (data.appStack === "" ? "ASP.Net" : data.appStack);
                        this.problemCategories = this.filterCategoriesForStack(this.allProblemCategories);
                        setTimeout(() => {
                            this.onComplete.emit({ status: true });
                        }, 300);
                    });
                });
            }
        });
    }

    filterCategoriesForStack(problemCategories: Category[]): Category[] {
        let categories: Category[] = [];
        problemCategories.forEach(c => {
            let subcategories = c.Subcategories.filter(x => (x.AppStack === "" || x.AppStack.toLowerCase().indexOf(this.AppStack.toLowerCase()) > -1));
            if (subcategories.length > 0) {
                let category = new Category();
                category.Name = c.Name;
                category.Collapsed = c.Collapsed;
                category.Subcategories = subcategories;
                categories.push(category);
            }
        });

        return categories;
    }

    logCategorySelected(name: string) {
        this._logger.LogClickEvent(name, 'Home Page');
    }

    ngAfterViewInit(): void {
        this.onViewUpdate.emit();
    }

    onStackChanged(stack: string) {       
        this.AppStack = stack;
        this.showToolsDropdown = false;
        this.problemCategories = this.filterCategoriesForStack(this.allProblemCategories);
        this.animateToolsOnly = true;
    }
}
