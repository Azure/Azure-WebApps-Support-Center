import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticData, Rendering, DataTableResponseObject, DetectorResponse } from '../../models/detector';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DataSet, Timeline} from 'vis';
import { DetectorControlService } from '../../services/detector-control.service';
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
    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, protected telemetryService: TelemetryService,
    protected changeDetectorRef: ChangeDetectorRef, protected diagnosticService: DiagnosticService,  private detectorControlService: DetectorControlService) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;
    }

    protected processData(data: DiagnosticData) {
        super.processData(data);
        this.parseData(data.table);
    }

    private parseData(data: DataTableResponseObject) {
        let rows = data.rows;
        if (rows.length > 0 && rows[0].length > 0) {
            this.changeSetText = rows.length == 1 ? `1 change group detected` : `${rows.length} change groups have been detected`;
            this.constructTimeline(data);
            this.initializeChangesView(data);
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
            group: this.findGroupBySource(changeset[2])
        })
        });

        // DOM element where the Timeline will be attached
        let container = document.getElementById('timeline');
        let items = new DataSet(timelineItems);
        // Configuration for the Timeline
        let options = {
            height: "200px",
            };
        // Create a Timeline
        let timeline = new Timeline(container, items, this.sourceGroups, options);
            timeline.on('select', this.triggerChangeEvent);

    }

    private initializeChangesView(data: DataTableResponseObject) {
        let latestChangeSet = data.rows[0];
        if(latestChangeSet[0] != undefined) {
            this.loadChangesTable(latestChangeSet[0]);
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
        }
        this.loadChangesTable(this.selectedChangeSetId);
    }

    private loadChangesTable(changeSetId: string): void {
        this.loadingChangesTable = true;
        this.changesTableError = '';
        let queryParams = `&changeSetId=${changeSetId}`;
        this.diagnosticService.getDetector(this.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
        this.detectorControlService.shouldRefresh, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) =>{
            this.changesDataSet = response.dataset;
            this.loadingChangesTable = false;
            this.changesTableError = '';
        }, (error: any) => {
            this.loadingChangesTable = false;
            this.changesTableError = 'Unable to load changes for the selected change group. Please try refresh or try after sometime';
        });
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
}
