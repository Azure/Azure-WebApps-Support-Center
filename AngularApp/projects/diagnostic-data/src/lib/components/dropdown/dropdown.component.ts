import { Component, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DataTableResponseObject, Rendering, DiagnosticData } from '../../models/detector';

@Component({
  selector: 'dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent extends DataRenderBaseComponent {

  renderingProperties: Rendering;
  label: string;
  selectedKey: string;
  selectedData: DiagnosticData[];
  keys: string[];

  private keyDataMapping: Map<string, DiagnosticData[]>;

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = data.renderingProperties;
    this.parseData(data.table);
  }

  private parseData(table: DataTableResponseObject) {

    let labelColumn = 0;
    let keyColumn = 1;
    let selectedColumn = 2;
    let valueColumn = 3;

    this.keyDataMapping = new Map<string, DiagnosticData[]>();

    for (let i: number = 0; i < table.rows.length; i++) {

      let row = table.rows[i];
      this.label = row[labelColumn];
      let key: string = row[keyColumn];
      let selected: boolean = row[selectedColumn].toLowerCase() === 'true';
      let data: string = row[valueColumn];
      let rawJson: any = JSON.parse(data);
      let diagnosticDataList: DiagnosticData[] = <DiagnosticData[]>rawJson;

      this.keyDataMapping.set(key, diagnosticDataList);

      if (selected === true) {
        this.selectedKey = key;
        this.selectedData = diagnosticDataList;
      }
    }

    this.keys = Array.from(this.keyDataMapping.keys());
  }

  selectKey(key: string) {
    this.selectedKey = key;
    this.selectedData = this.keyDataMapping.get(this.selectedKey);
  }
}
