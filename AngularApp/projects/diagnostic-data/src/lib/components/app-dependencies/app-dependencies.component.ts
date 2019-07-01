import { Component, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticData, DataTableResponseObject } from '../../models/detector';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { Network, DataSet, Node, Edge, IdType, Timeline } from 'vis';
import { ChangeAnalysisUtilities } from '../../utilities/changeanalysis-utilities';
import { DataTableUtilities} from '../../utilities/datatable-utilities';

@Component({
  selector: 'app-dependencies',
  templateUrl: './app-dependencies.component.html',
  styleUrls: ['./app-dependencies.component.scss']
})

export class AppDependenciesComponent extends DataRenderBaseComponent implements OnInit {

    datasetLocalCopy: DataTableResponseObject;
    azureIcons: any = {};
    primaryResourceId: string = '';
    constructor(protected telemetryService: TelemetryService) {
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
                shape: 'image'
            });

            rows.forEach(row => {
                let resourceUri = row[columnIndex];
                let resourceType = ChangeAnalysisUtilities.getResourceType(resourceUri);
                networkDataSet.push({
                    id: resourceUri,
                    image: ChangeAnalysisUtilities.getImgPathForResource(resourceType),
                    shape: 'image'
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
            layout: {
                hierarchical: {
                    direction: 'UD'
                }
            }
        };
        var network = new Network(container, networkData, networkOptions);
        network.on("selectNode", function (params) {
          console.log('selectNode Event:', params);
        });
        }

    }

}
