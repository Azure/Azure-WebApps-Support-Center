import { Component, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticData, DataTableResponseObject, DetectorResponse, Rendering } from '../../models/detector';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { Network, DataSet, Node, Edge, IdType, Timeline } from 'vis';
import { ChangeAnalysisUtilities } from '../../utilities/changeanalysis-utilities';
import { DataTableUtilities} from '../../utilities/datatable-utilities';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { ChangeAnalysisService} from '../../services/change-analysis.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
@Component({
  selector: 'app-dependencies',
  templateUrl: './app-dependencies.component.html',
  styleUrls: ['./app-dependencies.component.scss']
})

export class AppDependenciesComponent extends DataRenderBaseComponent implements OnInit {

    datasetLocalCopy: DataTableResponseObject;
    azureIcons: any = {};
    primaryResourceId: string = '';
    selectedResourceId: string = '';
    showLoader: boolean = false;
    constructor(protected telemetryService: TelemetryService, protected diagnosticService: DiagnosticService,
        protected detectorControlService: DetectorControlService, protected changeAnalysisService: ChangeAnalysisService) {
        super(telemetryService);
    }


    processData(data: DiagnosticData) {
       super.processData(data);
       this.parseData(data.table);
    }

    parseData(data: DataTableResponseObject): void {
        this.datasetLocalCopy = data;
        this.constructNetwork(data.rows);
    }

    constructNetwork(rows: any[][]): void {
        if(rows.length > 0) {
            this.primaryResourceId = rows[0][DataTableUtilities.getColumnIndexByName(this.datasetLocalCopy, 'PrimaryResource')];
            let columnIndex = DataTableUtilities.getColumnIndexByName(this.datasetLocalCopy, 'ResourceId');
            let networkDataSet = [];
            networkDataSet.push({
                id: this.primaryResourceId,
                image: ChangeAnalysisUtilities.getImgPathForResource(ChangeAnalysisUtilities.getResourceType(this.primaryResourceId)),
                shape: 'circularImage',
                title: this.primaryResourceId
            });

            rows.forEach(row => {
                let resourceUri = row[columnIndex];
                let resourceType = ChangeAnalysisUtilities.getResourceType(resourceUri);
                networkDataSet.push({
                    id: resourceUri,
                    image: ChangeAnalysisUtilities.getImgPathForResource(resourceType),
                    shape: 'circularImage',
                    title: resourceUri
                })
            });

        var nodes = new DataSet(networkDataSet);

        let edgesDataSet = [];
        // Create edges connecting Primary Resource to each Dependent resource.
        for(let i = 0; i< rows.length ; i++) {
            edgesDataSet.push({
                from: this.primaryResourceId,
                to: rows[i][columnIndex],
                arrows: 'to'
            })
        }

        // create an array with edges
        var edges = new DataSet(edgesDataSet);

        // create a network
        var container = document.getElementById('mynetwork');
        var networkData = {
          nodes: nodes,
          edges: edges
        };
        var networkOptions = {
            nodes: {
                borderWidth: 2,
                size: 30,
                color: {
                    border: '#365bf2',
                    background: '#fcfcfc'
                  }
            },
            interaction: {
                hover: true
            },
            layout: {
                hierarchical: {
                    direction: 'UD'
                }
            }
        };
        var network = new Network(container, networkData, networkOptions);
        network.on("selectNode", this.triggerTimelineRefresh);
        }

    }

    private triggerTimelineRefresh(properties: any): void {
        let domelement = <HTMLInputElement>document.getElementById("resourceUri");
        if(typeof properties.nodes != 'undefined') {
            domelement.value = properties.nodes[0];
            let event = new Event('change');
            domelement.dispatchEvent(event);
        }
    }

    refreshChangeTimeline(): void {
        //this.logGraphClick();
        let selectedResource = <HTMLInputElement> document.getElementById('resourceUri');
        if(selectedResource.value) {
            this.selectedResourceId = selectedResource.value;
            this.loadChangesTimeLine();
        }
    }

    logGraphClick(): void {
        let eventProps = {
            'Detector': this.detector,
        }
        this.telemetryService.logEvent(TelemetryEventNames.DependencyGraphClick, eventProps);
    }

    loadChangesTimeLine(): void {
        let sub = ChangeAnalysisUtilities.getSubscription(this.selectedResourceId);
        let resourceGroups = ChangeAnalysisUtilities.getResourceGroup(this.selectedResourceId);
        let provider = ChangeAnalysisUtilities.getResourceType(this.selectedResourceId);
        let resourceName = ChangeAnalysisUtilities.getResourceName(this.selectedResourceId, provider);
        let queryParams = `&fId=101&btnId=9&inpId=1&val=${encodeURIComponent(sub)}&inpId=2&val=${encodeURIComponent(resourceGroups)}&inpId=3&val=${encodeURIComponent(provider)}&inpId=4&val=${encodeURIComponent(resourceName)}`;
        this.showLoader = true;
        this.changeAnalysisService.setCurrentResourceName(resourceName);
        this.changeAnalysisService.setAppService(provider);
        this.diagnosticService.getDetector(this.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
            this.detectorControlService.shouldRefresh, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) =>{
                let changeSets = response.dataset.filter(set => (<Rendering>set.renderingProperties).type === 16);
                if(changeSets.length > 0) {
                    this.changeAnalysisService.loadResourceChangeGroups(JSON.stringify(changeSets[0]));
                }
                this.showLoader = false;
            }, (error: any) => {
                this.showLoader = false;
            });
    }

}
