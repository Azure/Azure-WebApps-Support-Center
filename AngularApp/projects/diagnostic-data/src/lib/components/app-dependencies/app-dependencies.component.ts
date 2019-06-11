import { Component, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticData, DataTableResponseObject } from '../../models/detector';
import {DataSet, Network } from 'vis';
@Component({
  selector: 'app-dependencies',
  templateUrl: './app-dependencies.component.html',
  styleUrls: ['./app-dependencies.component.scss']
})
export class AppDependenciesComponent extends DataRenderBaseComponent {
     datasetLocalCopy: DataTableResponseObject;
    processData(data: DiagnosticData) {
       super.processData(data);
       this.parseData(data.table);
    }
    parseData(data: DataTableResponseObject): void {
        this.datasetLocalCopy = data;
    }
}
