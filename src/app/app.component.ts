import { Component, OnInit, isDevMode } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { INavigationItem } from "./shared/models/inavigationitem";
import * as _ from 'underscore';
import { AuthService } from './shared/services/auth.service';
import { WindowService } from './shared/services/window.service';
import { LoggingService } from './shared/services/logging/logging.service';
import { StartupInfo } from './shared/models/portal';
import { Observable } from 'rxjs';
import { GenericApiService } from './shared/services/generic-api.service';

@Component({
    selector: 'sc-app',
    templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {

    public navigationItems: INavigationItem[];
    public contentMaxHeight: number;

    private _hardCodedSupportTopicIdMapping = [
        {
            pesId: '14748',
            supportTopicId: '32583701',
            path: '/diagnostics/availability/detectors/sitecpuanalysis/focus',
        },
        {
            pesId: '14748',
            supportTopicId: '32457411',
            path: '/diagnostics/performance/analysis',
        },
        {
            pesId: '14748',
            supportTopicId: '32570954',
            path: '/diagnostics/availability/apprestartanalysis',
        },
        {
            pesId: '14748',
            supportTopicId: '32542218',
            path: '/diagnostics/availability/analysis',
        },
        {
            pesId: '14748',
            supportTopicId: '32581616',
            path: '/diagnostics/availability/memoryanalysis',
        }
    ]

    constructor(private _authService: AuthService, private _router: Router, private _activatedRoute: ActivatedRoute, private _windowService: WindowService, private _logger: LoggingService, private _genericApi: GenericApiService) {
        this.navigationItems = [];
        this.contentMaxHeight = 0;
    }

    ngOnInit() {
        this.contentMaxHeight = this._windowService.window.innerHeight - 55;

        if (isDevMode()) {
            console.log('%c Support Center is running in dev mode', 'color: orange')
            console.log('%c Logs that are normally published to the portal kusto logs will show up in the console', 'color: orange')
        }

        this._authService.getStartupInfo()
            .subscribe(info => {
                // For now there will be a hard coded destination.
                // In the future we will pass the tool path in with the startup info
                var adjustedResourceId = info.resourceId.toLowerCase().replace("/providers/microsoft.web", "");
                let subscriptionId = this.getSubscriptionIdFromResourceUri(adjustedResourceId);

                let redirectPath = this.getRouteBasedOnSupportTopicId(info).subscribe(redirectPath => {
                    this._router.navigate([adjustedResourceId + redirectPath]);
                });
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

    getRouteBasedOnSupportTopicId(info: StartupInfo): Observable<string> {

        let path: string;
        
        // If no support topic id, then default to diagnostics home page
        if (!info.supportTopicId || info.supportTopicId === '') {
            path = '/diagnostics';
        }

        return this._genericApi.getDetectors().map(detectors => {            
            if (detectors) {
                let matchingDetector = detectors.find(detector => 
                    detector.supportTopicList && 
                    detector.supportTopicList.findIndex(supportTopic => supportTopic.id === info.supportTopicId) >= 0);

                if (matchingDetector) {
                    return `/detectors/${matchingDetector.id}`;
                }
            }

            let matchingMapping = this._hardCodedSupportTopicIdMapping
                .find(supportTopic => supportTopic.supportTopicId === info.supportTopicId && (!info.pesId || info.pesId === '' || supportTopic.pesId === info.pesId))

            return matchingMapping ? matchingMapping.path : '/diagnostics';
        })
        .catch((error, caught) => {
            return '/diagnostics';
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