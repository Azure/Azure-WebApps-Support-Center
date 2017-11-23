import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AppInsightsService, AppInsightsQueryService, PortalActionService } from '../../../shared/services';

@Component({
    selector: 'app-insights-exceptions',
    templateUrl: 'app-insights-exceptions.component.html',
    //styleUrls: ['app-insights-dependencies.component.css']
})
export class AppInsightsExceptionsComponent implements OnInit, OnChanges {

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    @Input() startTime: string;
    @Input() endTime: string;

    loading: boolean;
    exceptions: any = [];

    constructor(private _route: ActivatedRoute, private appInsightsService: AppInsightsService, private appInsightsQueryService: AppInsightsQueryService, private portalActionService: PortalActionService) {
        this.exceptions = [];
    }

    ngOnInit(): void {

        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';
    }

    ngOnChanges(changes: SimpleChanges): void {

        this.appInsightsService.loadAppDiagnosticPropertiesObservable.subscribe(propertiesLoadStatus => {

            if (changes['startTime'] && this.appInsightsService.appInsightsSettings.validForStack) {
                this.exceptions = [];
                this.loading = true;
                this.appInsightsService.loadAppInsightsResourceObservable.subscribe(loadStatus => {
                    this.appInsightsQueryService.GetTopExceptions(this.startTime, this.endTime).subscribe((data: any) => {
                        let rows = data["Tables"][0]["Rows"];
                        this.parseRowsIntoExceptions(rows);
                        this.loading = false;
                    });
                });
            }

        });
    }

    parseRowsIntoExceptions(rows: any) {
        if (!rows || rows.length === 0) {
            return;
        }

        rows.forEach(element => {
            this.exceptions.push({
                message: element[0],
                exception: element[1],
                count: element[2]
            });
        });
    }

    OpenAppInsights() {
        this.portalActionService.openAppInsightsBlade();
    }
}
