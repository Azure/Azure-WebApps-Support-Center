import { Component, OnInit, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { INavigationItem } from "./shared/models/inavigationitem";
import { AuthService } from './startup/services/auth.service';
import { WindowService } from './startup/services/window.service';
import { StartupInfo } from './shared/models/portal';
import 'rxjs/add/operator/filter';
import { environment } from '../environments/environment';

@Component({
    selector: 'sc-app',
    templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {

    public navigationItems: INavigationItem[];
    public contentMaxHeight: number;

    private _newVersionEnabled = true;

    public get newVersionEnabled() { return this._newVersionEnabled; }

    public set newVersionEnabled(value: boolean) { 
        console.log(value);
        this._newVersionEnabled = value;
        //this.navigateToExperience();
     }

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

    constructor(private _authService: AuthService, private _router: Router, private _windowService: WindowService) {
        this.navigationItems = [];
        this.contentMaxHeight = 0;
    }

    ngOnInit() {
        this.contentMaxHeight = this._windowService.window.innerHeight - 55;

        if (isDevMode()) {
            console.log('%c Support Center is running in dev mode', 'color: orange')
            console.log('%c Logs that are normally published to the portal kusto logs will show up in the console', 'color: orange')
        }

        if (this._authService.inIFrame || this._authService.hasLocalStartupInfo) {
            this._router.navigate(['/resourceRedirect']);
        }
        else {
            this._router.navigate(['/test']);
        }

        //this.navigateToExperience();
    }

    // navigateToExperience() {
    //     this._authService.getStartupInfo()
    //     .subscribe(info => {
    //         if (info && info.resourceId && info.token) {
    //             if (this.newVersionEnabled) {
    //                 this._router.navigate([info.resourceId]);
    //             }
    //             else {
    //                 // For now there will be a hard coded destination.
    //                 // In the future we will pass the tool path in with the startup info
    //                 var adjustedResourceId = info.resourceId;
    //                 this._router.navigate(['legacy/' + adjustedResourceId + this.getRouteBasedOnSupportTopicId(info)]);
    //             }
    //         }
    //         else {
    //             if(!environment.production) {
    //                 this._router.navigateByUrl('/test');
    //             }
    //         }
    //     });
    // }

    // getRouteBasedOnSupportTopicId(info: StartupInfo): string {

    //     let path: string;

    //     // If no support topic id, then default to diagnostics home page
    //     if (!info.supportTopicId || info.supportTopicId === '') {
    //         path = '/diagnostics';
    //     }
    //     else {
    //         path = `/supportTopic/${info.supportTopicId}`;
    //     }

    //     return path;

        

        // return this._genericApi.getDetectors().map(detectors => {
        //     if (detectors) {
        //         let matchingDetector = detectors.find(detector =>
        //             detector.supportTopicList &&
        //             detector.supportTopicList.findIndex(supportTopic => supportTopic.id === info.supportTopicId) >= 0);

        //         if (matchingDetector) {
        //             return `/detectors/${matchingDetector.id}`;
        //         }
        //     }

        //     let matchingMapping = this._hardCodedSupportTopicIdMapping
        //         .find(supportTopic => supportTopic.supportTopicId === info.supportTopicId && (!info.pesId || info.pesId === '' || supportTopic.pesId === info.pesId))

        //     return matchingMapping ? matchingMapping.path : '/diagnostics';
        // })
        //     .catch((error, caught) => {
        //         return '/diagnostics';
        //     });
    // }

    // selectTab(tab: INavigationItem) {

    //     if (tab.isActive) {
    //         // Tab is already active.
    //         return;
    //     }

    //     this.navigationItems.forEach(element => {
    //         element.isActive = false;
    //     });

    //     tab.isActive = true;
    //     //this._logger.LogTabOpened(tab.title);
    // }

    // closeTab(index: number): void {

    //     // We dont want to close the first tab.
    //     if (index > 0) {
    //         let tab = this.navigationItems[index];
    //         this.navigationItems.splice(index, 1);
    //        // this._logger.LogTabClosed(tab.title);
    //         if (tab.isActive) {
    //             this._router.navigateByUrl(this.navigationItems[index - 1].url);
    //         }
    //     }
    // }

    // private getSubscriptionIdFromResourceUri(resourceUri: string): string {

    //     let uriParts = resourceUri.split('/');
    //     if (uriParts && uriParts.length > 0) {
    //         let index = uriParts.indexOf('subscriptions');
    //         if (index > -1 && (index + 1 < uriParts.length)) {
    //             return uriParts[index + 1];
    //         }
    //     }

    //     return '';
    // }
}