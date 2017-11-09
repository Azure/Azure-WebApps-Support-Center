import { Component, OnInit } from '@angular/core';
import { AuthService, WindowService, LoggingService } from './shared/services';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { INavigationItem } from "./shared/models/inavigationitem";
import * as _ from 'underscore';

@Component({
    selector: 'sc-app',
    templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {

    public navigationItems: INavigationItem[];
    public contentMaxHeight: number;

    // Allowed List of subscriptions for home page.
    private allowedSubscriptions: string[] = [
        "85de1cc4-8496-4138-8108-ca05d5822468", // antps01
        "1402be24-4f35-4ab7-a212-2cd496ebdf14", // antps05
        "079ae74b-9689-40ac-8ec1-64ec0ef64562",  // antps20
        "0542bd5e-4c49-4e12-8976-8a3c92b0e05f", // antps28,
        "ef90e930-9d7f-4a60-8a99-748e0eea69de" // AntaresDemo
    ];

    constructor(private _authService: AuthService, private _router: Router, private _activatedRoute: ActivatedRoute, private _windowService: WindowService, private _logger: LoggingService) {
        this.navigationItems = [];
        this.contentMaxHeight = 0;
    }

    ngOnInit() {
        this.contentMaxHeight = this._windowService.window.innerHeight - 55;

        this._authService.getStartupInfo()
            .subscribe(info => {

                let subscription = this.getSubscriptionIdFromResourceUri(info.resourceId);
                if(this.allowedSubscriptions.indexOf(subscription.toLowerCase())> 0){
                    AuthService.newFeatureEnabled = true;   
                };

                // For now there will be a hard coded destination.
                // In the future we will pass the tool path in with the startup info
                var adjustedResourceId = info.resourceId.toLowerCase().replace("/providers/microsoft.web", "");
                let subscriptionId = this.getSubscriptionIdFromResourceUri(adjustedResourceId);

                switch (info.supportTopicId) {
                    case "32583701":
                        this._router.navigate([adjustedResourceId + '/diagnostics/availability/detectors/sitecpuanalysis/focus']);
                        break;
                    case "32457411":
                        this._router.navigate([adjustedResourceId + '/diagnostics/performance/analysis']);
                        break;
                    case "32570954":
                        this._router.navigate([adjustedResourceId + '/diagnostics/availability/apprestartanalysis']);
                        break;
                    case "32542218":
                        this._router.navigate([adjustedResourceId + '/diagnostics/availability/analysis']);
                        break;
                    case "32581616":
                        this._router.navigate([adjustedResourceId + '/diagnostics/availability/memoryanalysis']);
                        break;
                    default:
                        this._router.navigate([adjustedResourceId + '/diagnostics']);
                        break;
                }
            });

        this._router.events.filter(event => event instanceof NavigationEnd).subscribe(event => {

            let navigationTitleStr: string = "navigationTitle";
            let currentRoute = this._activatedRoute.root;
            while (currentRoute.children[0] !== undefined) {
                currentRoute = currentRoute.children[0];
            }

            if (currentRoute.snapshot.data.hasOwnProperty(navigationTitleStr)) {

                var navigationTitle = currentRoute.snapshot.data[navigationTitleStr];

                if (navigationTitle.indexOf(':') >= 0) {
                    let parameterName = navigationTitle.replace(':', '');
                    if (currentRoute.snapshot.params.hasOwnProperty(parameterName)) {
                        navigationTitle = currentRoute.snapshot.params[parameterName];
                    }
                }

                let existingTab = _.find(this.navigationItems, (item) => { return item.url === this._router.url });

                if (!existingTab) {
                    existingTab = {
                        title: navigationTitle,
                        url: this._router.url,
                        params: currentRoute.snapshot.params,
                        isActive: false
                    };

                    this.navigationItems.push(existingTab);
                }

                this.selectTab(existingTab);
            }
        });
    }

    selectTab(tab: INavigationItem) {

        if (tab.isActive) {
            // Tab is already active.
            return;
        }

        this.navigationItems.forEach(element => {
            element.isActive = false;
        });

        tab.isActive = true;
        this._logger.LogTabOpened(tab.title);
    }

    closeTab(index: number): void {

        // We dont want to close the first tab.
        if (index > 0) {
            let tab = this.navigationItems[index];
            this.navigationItems.splice(index, 1);
            this._logger.LogTabClosed(tab.title);
            if (tab.isActive) {
                this._router.navigateByUrl(this.navigationItems[index - 1].url);
            }
        }
    }

    private getSubscriptionIdFromResourceUri(resourceUri: string): string {

        let uriParts = resourceUri.split('/');
        if (uriParts && uriParts.length > 0) {
            let index = uriParts.indexOf('subscriptions');
            if (index > -1 && (index + 1 < uriParts.length)) {
                return uriParts[index + 1];
            }
        }

        return '';
    }
}