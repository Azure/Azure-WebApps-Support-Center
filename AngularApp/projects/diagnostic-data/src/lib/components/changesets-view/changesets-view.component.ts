import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticData, Rendering, DataTableResponseObject, DetectorResponse, RenderingType } from '../../models/detector';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DataSet, Timeline} from 'vis';
import { DetectorControlService } from '../../services/detector-control.service';
import moment = require('moment');
import { Subscription, Observable, interval } from 'rxjs';


@Component({
  selector: 'changesets-view',
  templateUrl: './changesets-view.component.html',
  styleUrls: ['./changesets-view.component.scss',
  '../insights/insights.component.scss']
})
export class ChangesetsViewComponent extends DataRenderBaseComponent {
    isPublic: boolean;
    changeSetText: string = '';
    scanDate: string = '';
    selectedChangeSetId: string = '';
    changesDataSet: DiagnosticData[];
    loadingChangesTable: boolean = true;
    changesTableError: string = '';
    sourceGroups = new DataSet([
        {id: 1, content: 'Properties'},
        {id: 2, content: 'Code'}
    ]);
    scanStatusMessage: string = '';
    allowScanAction: boolean = false;
    changeSetsCache = {};
    subscription: Subscription;
    scanState: string = '';
    showViewChanges: boolean = false;
    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, protected telemetryService: TelemetryService,
    protected changeDetectorRef: ChangeDetectorRef, protected diagnosticService: DiagnosticService,  private detectorControlService: DetectorControlService) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;
    }

    protected processData(data: DiagnosticData) {
        super.processData(data);
        this.parseData(data.table);
        if(this.isPublic) {
            this.subscription = interval(5000).subscribe(res => {
                this.pollForScanStatus();
            });
        }
    }

    private parseData(data: DataTableResponseObject) {
        let rows = data.rows;
        if (rows.length > 0 && rows[0].length > 0) {
            this.changeSetText = rows.length == 1 ? `1 change group detected` : `${rows.length} change groups have been detected`;
            this.constructTimeline(data);
            if(!this.developmentMode) {
                this.initializeChangesView(data);
            }
            // Convert UTC timestamp to user readable date
            this.scanDate = moment(rows[0][6]).format("ddd, MMM D YYYY, h:mm:ss a");
        } else {
             this.changeSetText = `No change groups have been detected`;
        }
    }

    private constructTimeline(data: DataTableResponseObject) {
        let changeSets = data.rows;
        let timelineItems = [];
        changeSets.forEach(changeset => {
        timelineItems.push({
            id: changeset[0],
            content: ' ',
            start: changeset[3],
            group: this.findGroupBySource(changeset[2]),
            className: this.findGroupBySource(changeset[2]) == 1 ? 'red' : 'green'
        })
        });

        // DOM element where the Timeline will be attached
        let container = document.getElementById('timeline');
        let items = new DataSet(timelineItems);
        // Configuration for the Timeline
        let options = {
            height: "250px",
            };
        // Create a Timeline
        let timeline = new Timeline(container, items, this.sourceGroups, options);
            timeline.on('select', this.triggerChangeEvent);

    }

    private initializeChangesView(data: DataTableResponseObject) {
        let latestChangeSet = data.rows[0][7];
        if(latestChangeSet != null) {
            this.loadingChangesTable = true;
            this.changesTableError = '';
            this.changesDataSet = [{
               table:{
                    columns:[],
                    rows: data.rows[0][7]
                    },
                renderingProperties: RenderingType.ChangesView
            }];
            // Add to cache
            this.changeSetsCache[data.rows[0][0]] = this.changesDataSet;
            this.loadingChangesTable = false;
            this.changesTableError = '';
        }
    }

    // Trigger change event to set component properties
    // This is a hack to trigger angular event, because updating Angular component properties in callback of vis.js does not update the Angular UI
    // TODO: Find a better way of updating angular UI
    private triggerChangeEvent(properties: any): void {
        let domelement = <HTMLInputElement>document.getElementById("changeSetId");
        domelement.value = properties.items[0];
        let event = new Event('change');
        domelement.dispatchEvent(event);
    }

    private refreshChangesTable(): void {
        let changeSetIdDom = <HTMLInputElement>document.getElementById("changeSetId");
        if(changeSetIdDom.value != undefined) {
            this.selectedChangeSetId =  changeSetIdDom.value;
            this.loadChangesTable(this.selectedChangeSetId);
        }
    }

    private loadChangesTable(changeSetId: string): void {
        this.loadingChangesTable = true;
        this.changesTableError = '';
        // Check cache first
        if (this.changeSetsCache.hasOwnProperty(changeSetId)) {
            this.changesDataSet = this.changeSetsCache[changeSetId];
            // Angular change detector does not check contents of array itself, so manually trigger the ui to update.
            this.changeDetectorRef.detectChanges();
            this.loadingChangesTable = false;
            this.changesTableError = '';
        } else {
            let queryParams = `&changeSetId=${changeSetId}`;
            this.diagnosticService.getDetector(this.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
            this.detectorControlService.shouldRefresh, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) =>{
            this.changeSetsCache[changeSetId] = response.dataset;
            this.changesDataSet = this.changeSetsCache[changeSetId];
            this.changeDetectorRef.detectChanges();
            this.loadingChangesTable = false;
            this.changesTableError = '';
        }, (error: any) => {
            this.loadingChangesTable = false;
            this.changesTableError = 'Unable to load changes for the selected change group. Please try refresh or try after sometime';
        });
        }
    }

    private findGroupBySource(source: any): number {
        switch(source){
        case "ARG":
        return 1;
        case "ARM":
        return 1;
        case "AST":
        return 2;
        default:
        return 1;
        }
    }

    private scanNow() {
        this.scanState = "Submitting";
        this.scanStatusMessage = "Submitting scan request...";
        this.allowScanAction = false;
        let queryParams = `&scanAction=submitscan`;
        console.log("Submitting scan request");
        this.diagnosticService.getDetector(this.detector,  this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
            this.detectorControlService.shouldRefresh, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) => {
                let dataset = response.dataset;
                let table = dataset[0].table;
                let rows = table.rows;
                let submissionState = rows[0][1];
                this.scanState = submissionState;               
                // Request has been submitted, update the UI with the state.
                console.log("Request has been submitted, update the UI with the state : " + submissionState);
                this.setScanState(submissionState);
                // Start polling every 5 secs to see the progress.
                console.log("Starting polling to see scan progress");
                this.subscription = interval(5000).subscribe(res => {
                    this.pollForScanStatus();
                });
            }, (error: any) => {
                this.scanStatusMessage = "Unable to submit scan request. Please refresh or try again after sometime";
        });
    }

    private pollForScanStatus() {
        this.scanStatusMessage = "Checking last scan status...";
        this.scanState = "Polling";
        this.allowScanAction = false;
        let queryParams = `&scanAction=checkscan`;
        this.diagnosticService.getDetector(this.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
            this.detectorControlService.shouldRefresh, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) => {
                let dataset = response.dataset;
                let table = dataset[0].table;
                let rows = table.rows;
                let submissionState = rows[0][1];
                this.scanState = submissionState;
                // Inscan & Submitted is not a final state, so continue polling.
                if (submissionState == "Inscan" || submissionState == "Submitted") {
                    this.setScanState(submissionState);
                } else {
                    // Completed or Failed is a final state, stop polling
                    this.setScanState(submissionState, rows[0][3]);
                    if(this.subscription) {
                        this.subscription.unsubscribe();
                    }
                }
            }, (error: any) => {
                // Stop timer in case of any error
                if(this.subscription) {
                    this.subscription.unsubscribe();
                }
                this.setScanState("")
            });
    }

    private setScanState(submissionState: string, completedTime?: string) {
        console.log("Setting scan state : "+ submissionState);
        switch(submissionState) {
            case "Submitted":
                this.scanStatusMessage = "Scan request has been submitted...";
                this.allowScanAction = false;
                break;
            case "Inscan":
                this.scanStatusMessage = "Scanning is in progress. This may take few minutes";
                this.allowScanAction = false;
                break;
            case "Completed":
                console.log("Checking difference between completed time and current time");
                let currentMoment = moment();
                let completedMoment = moment(completedTime);
                let diff = currentMoment.diff(completedMoment, 'seconds');
                console.log("Current moment is " + currentMoment.format("ddd, MMM D YYYY, h:mm:ss a"));
                console.log("Completed moment is" + completedMoment.format("ddd, MMM D YYYY, h:mm:ss a"));
                console.log("Difference in seconds is :" + diff);
                // If scan has been completed more than a minute ago, display default message
                if (diff >= 60) {
                    console.log("Scan completed more than a minute ago, display default message");
                    this.scanStatusMessage = "Click the below button to scan your webapp and get the latest changes";
                    this.allowScanAction = true;
                    this.showViewChanges = false;
                } else {
                    this.scanStatusMessage = "Scanning is complete. Click the below button to view the latest changes now.";
                    this.allowScanAction = true;
                    this.showViewChanges = true;
                }
                break;
            case "Failed":
                this.scanStatusMessage = "The last scan request failed. Click the below button to submit new scan request";
                this.allowScanAction = true;
                this.showViewChanges = false;
                break;
            default:
                this.scanStatusMessage = "Click the below button to to scan your webapp and get the latest changes";
                this.allowScanAction = true;
                this.showViewChanges = false;
                break;
        }
    }

    // Gets icon class for scan message based on scan state.
    getScanStatusClass() {
        let currentScanState = this.scanState;
        switch(currentScanState) {
            case "Polling":
            return {
                'fa-circle-o-notch' : true,
                'fa-spin': true,
                'spin-icon': true
            };
            case "Submitting":
            return {
                'fa-circle-o-notch' : true,
                'fa-spin': true,
                'spin-icon': true
            };
            case "Submitted":
            return {
                'fa-share-square': true
            }
            case "InScan":
            return {
                'fa-circle-o-notch' : true,
                'fa-spin': true,
                'spin-icon': true
            };
            case "Completed":
            return {
                'fa-check': true
            }
            case "Failed":
            return {
                'fa-times-circle': true
            }
        }
    }
   
    refreshTimeline(): void {

    }
    
    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
