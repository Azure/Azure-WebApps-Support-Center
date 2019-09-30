import { Component, ViewChild, AfterViewInit, TemplateRef } from '@angular/core';
import { DiagnosticData, DataTableRendering, RenderingType } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';

@Component({
  selector: 'data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent extends DataRenderBaseComponent implements AfterViewInit {

  ngAfterViewInit(): void {

    if (this.renderingProperties.descriptionColumnName != null) {
      this.table.selectionType = SelectionType.single;
      this.table.scrollbarV = true;
      this.table.scrollbarH = false;
      this.table.rowHeight = 35;
      this.currentStyles = { 'height': '300px' };
    }

    if (this.renderingProperties.height != null && this.renderingProperties.height !== "") {
      this.currentStyles = { 'height': this.renderingProperties.height ,'overflow-y':'visible' };
    }

    if (this.renderingProperties.tableOptions != null) {
      Object.keys(this.renderingProperties.tableOptions).forEach(item => {
        this.table[item] = this.renderingProperties.tableOptions[item];
      });
    }

    this.table.rows = this.rows;
    this.table.columns = this.columns;
  }

  DataRenderingType = RenderingType.Table;
  columns: any[];
  selected = [];
  rows: any[];
  rowsClone: any[];
  grouped: boolean = true;
  rowLimit: 25;
  renderingProperties: DataTableRendering;
  currentStyles = {};
  searchTexts = {};

  @ViewChild('myTable') table: DatatableComponent
  @ViewChild("headerTemplate") headerTemplate: TemplateRef<any>;

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <DataTableRendering>data.renderingProperties;
    this.createNgxDataTableObjects();
  }

  private createNgxDataTableObjects() {

    let columns = this.diagnosticData.table.columns.map(column =>
      <any>{
        name: column.columnName,
        resizable: true,
        sortable: true,
        prop: column.columnName
      });

    if (this.renderingProperties.allowColumnSearch) {
      columns = this.diagnosticData.table.columns.map(column =>
        <any>{
          name: column.columnName,
          resizable: true,
          sortable: true,
          prop: column.columnName,
          headerTemplate: this.headerTemplate
        });
    }

    this.columns = columns.filter((item) => item.name !== this.renderingProperties.descriptionColumnName);
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

  updateFilter(event: any, prop: any) {
    this.selected = [];
    const val = event.target.value.toLowerCase();
    this.searchTexts[prop] = val;

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
    this.table.rows = this.rows;

  }

}
