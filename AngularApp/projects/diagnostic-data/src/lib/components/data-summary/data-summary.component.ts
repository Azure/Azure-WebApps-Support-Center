import { Component } from '@angular/core';
import { DiagnosticData, DataTableRendering, Rendering, RenderingType } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';

@Component({
  selector: 'data-summary',
  templateUrl: './data-summary.component.html',
  styleUrls: ['./data-summary.component.scss']
})
export class DataSummaryComponent extends DataRenderBaseComponent {

  DataRenderingType = RenderingType.DataSummary;

  renderingProperties: Rendering;

  public summaryViewModels: DataSummaryViewModel[] = [];

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <Rendering>data.renderingProperties;

    this.createViewModel()
  }

  private createViewModel() {
    if (this.diagnosticData.table.rows.length > 0) {
      let rows = this.diagnosticData.table.rows;

      let labelColumn = 0;
      let valueColumn = 1;
      let colorColumn = 2;
      rows.forEach(row => {
        this.summaryViewModels.push(<DataSummaryViewModel>{ name: row[labelColumn], value: row[valueColumn], color: row[colorColumn] });
      })
    }
  }
}

export class DataSummaryViewModel {
  value: string;
  name: string;
  color: string;
}