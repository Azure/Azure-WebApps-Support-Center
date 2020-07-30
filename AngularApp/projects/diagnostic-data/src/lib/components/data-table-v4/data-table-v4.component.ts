import { Component, ViewChild, AfterViewInit, TemplateRef, AfterContentInit, ContentChild, Directive, OnInit, ContentChildren, QueryList, ViewChildren } from '@angular/core';
import { DiagnosticData, DataTableRendering, RenderingType } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';
import { SelectionMode, IColumn, IDetailsListProps, IDetailsHeaderProps, IDetailsFooterProps, IPlainCard, IPlainCardProps, IListProps, IDetailsColumnProps, IDetailsRowProps, IExpandingCardProps } from 'office-ui-fabric-react';
import { InputRendererOptions } from '@angular-react/core';
import { FabTextFieldComponent, FabDetailsListComponent, FabPlainCardComponent, IPlainCardOptions, IExpandingCardOptions, RenderCardContext, FabHoverCardComponent } from '@angular-react/fabric';
import { TelemetryService } from '../../services/telemetry/telemetry.service';

HC_exporting(Highcharts);

@Component({
  selector: 'data-table-v4',
  templateUrl: './data-table-v4.component.html',
  styleUrls: ['./data-table-v4.component.scss']
})
export class DataTableV4Component extends DataRenderBaseComponent implements AfterViewInit, AfterContentInit {
  Highcharts: typeof Highcharts = Highcharts;
  // constructor(protected telemetryService:TelemetryService) { 
  //   super(telemetryService);
  // }
  ngAfterViewInit(): void {
    if (this.renderingProperties.descriptionColumnName != null) {
      this.table.selectionType = SelectionType.single;
      this.table.scrollbarV = true;
      this.table.scrollbarH = false;
      this.table.rowHeight = 35;
      this.currentStyles = { 'height': '300px' };
    }

    if (this.renderingProperties.height != null && this.renderingProperties.height !== "") {
      this.currentStyles = { 'height': this.renderingProperties.height, 'overflow-y': 'visible' };
    }

    if (this.renderingProperties.tableOptions != null) {
      Object.keys(this.renderingProperties.tableOptions).forEach(item => {
        this.table[item] = this.renderingProperties.tableOptions[item];
      });
    }

    this.table.rows = this.rows;
    this.table.columns = this.columns;
  }

  ngAfterContentInit() {
    this.createFabricDataTableObjects();

    //For dynamic passing table properties
    this.fabDetailsList.selectionMode = SelectionMode.none;
    this.fabDetailsList.initialFocusedIndex = 0;
    this.fabDetailsList.onShouldVirtualize = (list: IListProps<any>) => {
      return this.rows.length > this.rowLimit ? false : true;
    }
    if (this.renderingProperties.allowColumnSearch) {
      // this.fabDetailsList.renderDetailsHeader = this.headerWithSearch;
    } 
  }
  
  DataRenderingType = RenderingType.Table;
  columns: any[];
  selected = [];
  rows: any[];
  rowsClone: any[];
  grouped: boolean = true;
  rowLimit = 25;
  renderingProperties: DataTableRendering;
  currentStyles = {};
  searchTexts = {};
  selectionMode = SelectionMode.none;
  tableColumns: IColumn[] = [];
  @ViewChild('myTable', { static: false }) table: DatatableComponent;
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
        this.selected.push(this.rows[0]);
      }

      this.rowsClone = Object.assign([], this.rows);
    });
  }

  toggleExpandGroup(group) {
    this.table.groupHeader.toggleExpandGroup(group);
  }

  getValue(): any {
    if (this.selected.length > 0) {
      return this.selected[0][this.renderingProperties.descriptionColumnName];
    }
  }

  //For now use one search bar for all columns 
  updateFilter(event: { event: Event, newValue?: string }, column: IColumn) {

    this.selected = [];
    // const val = event.target.value.toLowerCase();
    const val = event.newValue.toLowerCase();
    this.searchTexts[column.name] = val;

    const temp = this.rowsClone.filter(item => {
      let allMatch = true;
      Object.keys(this.searchTexts).forEach(key => {
        if (item[key]) {
          allMatch = allMatch && item[key].toString().toLowerCase().indexOf(this.searchTexts[key]) !== -1;
        }
      });
      return allMatch;
    });

    this.rows = temp;
    // this.table.rows = this.rows;
  }

  // onInputClicked(event: any) {
  //   event.stopPropagation();
  // }

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

  clickColumn(event: { ev: Event, column: IColumn }) {
    this.sortColumn(event.column);
  }

  sortColumn(column: IColumn) {
    const isSortedDescending = column.isSortedDescending;
    const columnName = column.name;

    this.rows.sort((r1, r2) => {
      return r1[columnName] > r2[columnName] ? 1 : -1;
    });

    if (column.isSortedDescending) {
      this.rows.reverse();
    }

    // let tableColumn = this.tableColumns.find(column => column.name === colName);
    // tableColumn.isSortedDescending = !isSortedDescending;
    // tableColumn.isSorted = true;
    column.isSortedDescending = !isSortedDescending;
    column.isSorted = true;
  }
}


