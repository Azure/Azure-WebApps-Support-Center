import { Component, ViewChild, AfterContentInit, TemplateRef, OnInit, AfterViewInit } from '@angular/core';
import { DiagnosticData, DataTableRendering, TableFilter, TableFilterSelectionOption, TableColumnOption } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { SelectionMode, IColumn, IListProps, ISelection, Selection, IStyle, DetailsListLayoutMode, ICalloutProps } from 'office-ui-fabric-react';
import { FabDetailsListComponent } from '@angular-react/fabric';
import { TelemetryService } from '../../services/telemetry/telemetry.service';

const columnMinWidth: number = 100;
const columnMaxWidth: number = 250;

@Component({
  selector: 'data-table-v4',
  templateUrl: './data-table-v4.component.html',
  styleUrls: ['./data-table-v4.component.scss']
})
export class DataTableV4Component extends DataRenderBaseComponent implements AfterContentInit {
  constructor(protected telemetryService: TelemetryService) {
    super(telemetryService);
  }

  ngAfterContentInit() {
    if (this.renderingProperties.columnOptions && this.renderingProperties.columnOptions.length > 0) {
      this.renderingProperties.columnOptions.forEach((option) => {
        if (this.validateFilterOption(option)) {
          this.tableFilters.push({ columnName: option.name, selectionOption: option.selectionOption });
        }
      });

      for (const filter of this.tableFilters) {
        this.filtersMap.set(filter.columnName, new Set<string>());
      }
    }

    this.createFabricDataTableObjects();

    this.fabDetailsList.selectionMode = this.renderingProperties.descriptionColumnName ? SelectionMode.single : SelectionMode.none;
    this.fabDetailsList.selection = this.selection;
    //Ideally,it should be enable if table is too large. 
    //But for now, if enabled, it will show only 40 rows
    this.fabDetailsList.onShouldVirtualize = (list: IListProps<any>) => {
      // return this.rows.length > this.rowLimit ? true : false;
      return false;
    }
    if (this.renderingProperties.allowColumnSearch) {
      this.allowColumnSearch = this.renderingProperties.allowColumnSearch;
    }

    if (this.renderingProperties.descriptionColumnName) {
      this.fabDetailsList.getRowAriaLabel = (row: any) => {
        const descriptionName = this.renderingProperties.descriptionColumnName;
        return `${descriptionName} : ${row[descriptionName]}`;
      }
    }

    let tableHeight = "";
    if (this.estimateTableHeight() >= this.heightThreshold) {
      tableHeight = `${this.heightThreshold}px`;
    }
    if (this.renderingProperties.height) {
      tableHeight = this.renderingProperties.height;
    }
    if (tableHeight !== "") {
      this.fabDetailsList.styles = { root: { height: tableHeight } };
    }

    this.fabDetailsList.layoutMode = DetailsListLayoutMode.justified;

    if (this.rowsClone.length === 0) {
      this.fabDetailsList.renderDetailsFooter = this.emptyTableFooter
    }
  }


  selection: ISelection = new Selection({
    onSelectionChanged: () => {
      const selectionCount = this.selection.getSelectedCount();
      if (selectionCount === 0) {
        this.selectionText = "";
      } else if (selectionCount === 1) {
        const row = this.selection.getSelection()[0];
        if (this.renderingProperties.descriptionColumnName) {
          const selectionText = row[this.renderingProperties.descriptionColumnName];
          this.selectionText = selectionText !== undefined ? selectionText : "";
        }
      }
    }
  });
  selectionText = "";
  rows: any[];
  rowsClone: any[] = [];
  rowLimit = 25;
  renderingProperties: DataTableRendering;
  columns: IColumn[] = [];
  allowColumnSearch: boolean = false;
  searchTimeout: any;
  searchAriaLabel = "Filter by all columns";
  heightThreshold = window.innerHeight * 0.5;
  tableFilters: TableFilter[] = [];
  searchValue: string = "";
  tableId: number = Math.floor(Math.random() * 100);
  //All options for filters to display
  filtersMap: Map<string, Set<string>> = new Map<string, Set<string>>();
  //Options that selected by each filter
  filterSelectionMap: Map<string, Set<string>> = new Map<string, Set<string>>();
  @ViewChild(FabDetailsListComponent, { static: true }) fabDetailsList: FabDetailsListComponent;
  @ViewChild('emptyTableFooter', { static: true }) emptyTableFooter: TemplateRef<any>
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
        minWidth: this.getMinOrMaxColumnWidth(column.columnName, true),
        maxWidth: this.getMinOrMaxColumnWidth(column.columnName, false),
      });

    this.columns = columns.filter((item) => item.name !== this.renderingProperties.descriptionColumnName && this.checkColumIsVisible(item.name));
    this.rows = [];

    this.diagnosticData.table.rows.forEach(row => {
      const rowObject: any = {};

      for (let i: number = 0; i < this.diagnosticData.table.columns.length; i++) {
        const columnName = this.diagnosticData.table.columns[i].columnName
        rowObject[columnName] = row[i];

        if (this.filtersMap.has(columnName)) {
          this.filtersMap.get(columnName).add(row[i]);
        }
      }

      this.rows.push(rowObject);

      this.rowsClone = Object.assign([], this.rows);
    });
  }


  updateTable() {
    //For single search bar
    const temp = [];
    for (const row of this.rowsClone) {
      if (this.checkRowWithSearchValue(row) && this.checkRowForFilter(row)) {
        temp.push(row);
      }
    }
    this.rows = temp;
    //Update rows order with column sorting
    const column = this.columns.find(col => col.isSorted === true);
    if (column) {
      this.sortColumn(column, column.isSortedDescending);
    }
  }

  checkRowWithSearchValue(row: any): boolean {
    for (const col of this.columns) {
      const cellValue: string = row[col.name].toString();
      if (cellValue.toString().toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1) return true;
    }
    return false;
  }

  updateTableBySearch(e: { event: Event, newValue?: string }) {
    // this.searchValue = e.newValue.toLowerCase();
    this.searchValue = e.newValue;
    const val = e.newValue.toLowerCase();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.telemetryService.logEvent("TableSearch", {
        'SearchValue': val
      });
    }, 5000);
    this.updateTable();
  }

  clickColumn(e: { ev: Event, column: IColumn }) {
    const isSortedDescending = !e.column.isSortedDescending;
    this.sortColumn(e.column, isSortedDescending);

  }

  private sortColumn(column: IColumn, isSortedDescending: boolean) {
    const columnName = column.name;

    this.rows.sort((r1, r2) => {
      return r1[columnName] > r2[columnName] ? 1 : -1;
    });

    if (isSortedDescending) {
      this.rows.reverse();
    }
    this.columns.forEach(column => {
      if (column.name === columnName) {
        column.isSortedDescending = isSortedDescending;
        column.isSorted = true;
      } else {
        column.isSorted = false;
        column.isSortedDescending = true;
      }
    });
  }

  estimateTableHeight(): number {
    return 25 * this.rowsClone.length;
  }

  getOptionsWithColName(name: string): string[] {
    const optionSet = this.filtersMap.get(name);
    return Array.from(optionSet);
  }

  updateFilter(name: string, options: Set<string>) {
    this.filterSelectionMap.set(name, options);
    //call updateTable to update table rows with latest filter
    this.telemetryService.logEvent(
      "TableFilterUpdated",
      { "FilterName": name }
    );
    this.updateTable();
  }

  private checkRowForFilter(row: any): boolean {
    //Only if filterSelectionMap has the column name and value for the cell value does not include in the set, return false
    const keys = Array.from(this.filterSelectionMap.keys());
    for (let key of keys) {
      if (row[key] !== undefined && !this.filterSelectionMap.get(key).has(row[key])) return false;
    }
    return true;
  }

  private getColumnOption(name: string): TableColumnOption {
    if (!this.renderingProperties.columnOptions ||
      !this.renderingProperties.columnOptions.find(option => option.name === name)) {
      return null;
    }
    const option = this.renderingProperties.columnOptions.find(o => o.name === name);
    return option;
  }

  private checkColumIsVisible(name: string): boolean {
    const option = this.getColumnOption(name);
    return option === null ? true : option.visible;
  }

  private getMinOrMaxColumnWidth(name: string, isMinWidth: boolean = true): number {
    let width = isMinWidth ? columnMinWidth : columnMaxWidth;
    const option = this.getColumnOption(name);
    if (isMinWidth && option && option.minWidth) {
      width = option.minWidth
    } else if (!isMinWidth && option && option.maxWidth) {
      width = option.maxWidth;
    }
    return width;
  }

  private validateFilterOption(option: TableColumnOption): boolean {
    if (option.selectionOption === undefined || option.selectionOption === TableFilterSelectionOption.None) {
      return false;
    }
    const columns = this.diagnosticData.table.columns;
    return columns.findIndex(col => col.columnName === option.name) > -1;
  }

  isMarkdown(s: any) {
    let str = `${s}`;
    str = str.trim();
    return str.startsWith('<markdown>') && str.endsWith('</markdown>');
  }
}


