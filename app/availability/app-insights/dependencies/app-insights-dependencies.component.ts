import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthService, AppInsightsService, AppAnalysisService } from '../../../shared/services';

@Component({
    selector: 'app-insights-dependencies',
    templateUrl: 'app-insights-dependencies.component.html'
})
export class AppInsightsDependenciesComponent implements OnInit {

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    constructor(private _route: ActivatedRoute, private authService: AuthService, public appInsightsService: AppInsightsService, private _appAnalysisService: AppAnalysisService) {
    }

    ngOnInit(): void {

        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';
    }
}
