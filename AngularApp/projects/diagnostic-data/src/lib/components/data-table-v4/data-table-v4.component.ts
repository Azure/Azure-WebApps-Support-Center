import { Component, ViewChild, AfterViewInit, AfterContentInit } from '@angular/core';
import { DiagnosticData, DataTableRendering, RenderingType } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';
import { SelectionMode, IColumn, IListProps, ISelection, Selection, IDetailsListProps, DetailsListLayoutMode, ITextFieldProps } from 'office-ui-fabric-react';
import { FabDetailsListComponent } from '@angular-react/fabric';
import { TelemetryService } from '../../services/telemetry/telemetry.service';

HC_exporting(Highcharts);

@Component({
  selector: 'data-table-v4',
  templateUrl: './data-table-v4.component.html',
  styleUrls: ['./data-table-v4.component.scss']
})
export class DataTableV4Component extends DataRenderBaseComponent implements AfterViewInit, AfterContentInit {
  Highcharts: typeof Highcharts = Highcharts;
  constructor(protected telemetryService: TelemetryService) {
    super(telemetryService);
  }
  ngAfterViewInit(): void {
    // if (this.renderingProperties.tableOptions != null) {
    //   Object.keys(this.renderingProperties.tableOptions).forEach(item => {
    //     this.table[item] = this.renderingProperties.tableOptions[item];
    //   });
    // }
  }

  ngAfterContentInit() {
    this.createFabricDataTableObjects();

    //For dynamic passing table properties
    this.fabDetailsList.selectionMode = this.renderingProperties.descriptionColumnName ? SelectionMode.single : SelectionMode.none;
    this.fabDetailsList.selection = this.selection;
    this.fabDetailsList.onShouldVirtualize = (list: IListProps<any>) => {
      return this.rows.length > this.rowLimit ? false : true;
    }
    if (this.renderingProperties.allowColumnSearch) {
      this.allowColumnSearch = this.renderingProperties.allowColumnSearch;
    }
    this.fabDetailsList.usePageCache = true;
    this.fabDetailsList.layoutMode = DetailsListLayoutMode.justified;


    //Customize table style
    let detailListStyles: IDetailsListProps["styles"] = { root: { height: '300px' } };
    if (this.renderingProperties.height != null && this.renderingProperties.height !== "") {
      detailListStyles = { root: { height: this.renderingProperties.height } };
    }
    this.fabDetailsList.styles = detailListStyles;
  }

  // DataRenderingType = RenderingType.Table;
  selection: ISelection = new Selection({
    onSelectionChanged: () => {
      const selectionCount = this.selection.getSelectedCount();
      if (selectionCount === 0) {
        this.selectionText = "";
      } else if (selectionCount === 1) {
        const row = this.selection.getSelection()[0];
        if (this.renderingProperties.descriptionColumnName) {
          this.selectionText = row[this.renderingProperties.descriptionColumnName];
        }
      }
    }
  });
  selectionText = "";
  rows: any[];
  rowsClone: any[];
  grouped: boolean = true;
  rowLimit = 25;
  renderingProperties: DataTableRendering;
  searchText = {};
  tableColumns: IColumn[] = [];
  allowColumnSearch: boolean = false;
  searchTimeout:any;
  @ViewChild(FabDetailsListComponent, { static: true }) fabDetailsList: FabDetailsListComponent;
  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <DataTableRendering>data.renderingProperties;
  }

  private createFabricDataTableObjects() {
    let columns = this.diagnosticData.table.columns.map(column =>
      <IColumn>{
        key: column.columnName,
        name: column.columnName,
        ariaLabel: column.columnName,
        isSortedDescending: true,
        isSorted: false,
        isResizable: true,
        isMultiline: true,
      });

    this.tableColumns = columns.filter((item) => item.name !== this.renderingProperties.descriptionColumnName);
    this.rows = [];

    this.diagnosticData.table.rows.forEach(row => {
      const rowObject: any = {};

      for (let i: number = 0; i < this.diagnosticData.table.columns.length; i++) {
        rowObject[this.diagnosticData.table.columns[i].columnName] = row[i];
      }

      this.rows.push(rowObject);

      if (this.renderingProperties.descriptionColumnName && this.rows.length > 0) {
        this.selectionText = ""
      }

      this.rowsClone = Object.assign([], this.rows);
    });
  }


  //For now use one search bar for all columns 
  updateFilter(e: { event: Event, newValue?: string }) {
    // const val = event.target.value.toLowerCase();
    const val = e.newValue.toLowerCase();
    if(this.searchTimeout){
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.telemetryService.logEvent("TableSearch",{
        'SearchValue': val
      });
    },5000);
    // this.searchTexts[column.name] = val;
    // const temp = this.rowsClone.filter(item => {
    //   let allMatch = true;
    //   Object.keys(this.searchTexts).forEach(key => {
    //     if (item[key]) {
    //       allMatch = allMatch && item[key].toString().toLowerCase().indexOf(this.searchTexts[key]) !== -1;
    //     }
    //   });
    //   return allMatch;
    // });

    //For single search bar
    const temp = [];
    for (const row of this.rowsClone) {
      for (const col of this.tableColumns) {
        const cellValue: string = row[col.name].toString();
        if (cellValue.toString().toLowerCase().indexOf(val) !== -1) {
          temp.push(row);
        }
      }
    }
    this.rows = temp;
  }

  onActivate(event: any) {
    if (!event.row || !event.row.TIMESTAMP) {
      return;
    }

    let timestamp = new Date(event.row.TIMESTAMP + 'Z');
    for (let i = 0; i < Highcharts.charts.length; i++) {
      let chart = Highcharts.charts[i];
      if (chart) {
        let xi = chart.xAxis[0];
        xi.removePlotLine("myPlotLine");
        xi.addPlotLine({
          value: timestamp.valueOf(),
          width: 1,
          color: 'grey',
          id: 'myPlotLine'
        });
      }
    }
  }

  clickColumn(e: { ev: Event, column: IColumn }) {
    this.sortColumn(e.column);
  }

  private sortColumn(column: IColumn) {
    const isSortedDescending = column.isSortedDescending;
    const columnName = column.name;

    this.rows.sort((r1, r2) => {
      return r1[columnName] > r2[columnName] ? 1 : -1;
    });

    if (column.isSortedDescending) {
      this.rows.reverse();
    }
    const col = this.tableColumns.find(c => c.name === columnName);
    col.isSortedDescending = !isSortedDescending;
    col.isSorted = true;
  }
}


