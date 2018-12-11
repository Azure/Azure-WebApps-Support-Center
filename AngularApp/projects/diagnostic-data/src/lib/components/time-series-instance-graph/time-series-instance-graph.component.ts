import { Component, OnInit, Input } from '@angular/core';
import { DataTableDataType, DiagnosticData, TimeSeriesPerInstanceRendering, DataTableResponseObject, DataTableResponseColumn } from '../../models/detector';
import { GraphSeries, GraphPoint } from '../nvd3-graph/nvd3-graph.component';
import { DataRenderBaseComponent, DataRenderer } from '../data-render-base/data-render-base.component';
import { InstanceDetails, DetailedInstanceTimeSeries } from '../../models/time-series';
import { TimeZones, TimeUtilities } from '../../utilities/time-utilities';
import * as momentNs from 'moment';

const moment = momentNs;

@Component({
  selector: 'time-series-instance-graph',
  templateUrl: './time-series-instance-graph.component.html',
  styleUrls: ['./time-series-instance-graph.component.scss']
})
export class TimeSeriesInstanceGraphComponent extends DataRenderBaseComponent implements OnInit, DataRenderer {

  allSeries: DetailedInstanceTimeSeries[] = [];
  allSeriesNames: string[] = [];
  instances: InstanceDetails[];
  selectedInstance: InstanceDetails;
  counters: string[];

  selectedSeries: GraphSeries[];

  renderingProperties: TimeSeriesPerInstanceRendering;
  dataTable: DataTableResponseObject;
  graphOptions: any;

  defaultValue: number = 0;

  filterByInstance: boolean;

  error: string;
  warning: string;

  timeGrainInMinutes: number = 5;

  processData(data: DiagnosticData) {
    super.processData(data);

    if (data) {
      let start = this.startTime;
      let end = this.endTime;
      let timeGrain = this.timeGrainInMinutes;

      TimeUtilities.roundDownByMinute(start, this.timeGrainInMinutes);
      TimeUtilities.roundDownByMinute(end, this.timeGrainInMinutes);
      end.minute(end.minute() - end.minute() % timeGrain).second(0);
      this.startTime = start;
      this.endTime = end;
      
      this.renderingProperties = <TimeSeriesPerInstanceRendering>data.renderingProperties;
      this.dataTable = data.table;
      this.graphOptions = data.renderingProperties.graphOptions;
      this._processDiagnosticData(data);
      this.selectSeries();
    }
  }

  selectSeries() {
    // TODO: Use below to add filtering
    // if (this.counters.length <= 1) {
    //   this.filterByInstance = false;
    //   this.allSeries.forEach(series => series.series.key = series.instance.displayName);
    // }
    // else {
    //   this.filterByInstance = true;
    //   this.selectedInstance = this.instances[0];
    // }

    this.selectedSeries = this.allSeries.map(series => series.series);
  }

  private _processDiagnosticData(data: DiagnosticData) {
    let timestampColumnIndex = data.table.columns.findIndex(column => column.dataType === DataTableDataType.DateTime);
    let instances = this._determineInstances(data.table);
    this.instances = instances;

    if (!instances || instances.length <= 0) {
      return;
    }

    let allSeries: DetailedInstanceTimeSeries[] = [];
    let tablePoints: InstanceTablePoint[] = [];
    if (!this.renderingProperties.counterColumnName || this.renderingProperties.counterColumnName == '') {
      let valueColumns: DataTableResponseColumn[] = data.table.columns.filter(column => DataTableDataType.NumberTypes.indexOf(column.dataType) >= 0);
      this.counters = valueColumns.map(col => col.columnName);
      valueColumns.forEach(column => instances.forEach(instance =>
        allSeries.push(<DetailedInstanceTimeSeries>{
          instance: instance,
          name: column.columnName,
          series: <GraphSeries>{
            key: `${instance.displayName}-${column.columnName}`,
            values: []
          }
        })));

      data.table.rows.forEach(row => {
        let instance = this._getInstanceFromRow(data.table, row);
        valueColumns.forEach(column => {
          let columnIndex: number = data.table.columns.indexOf(column);

          let timestamp = moment.utc(row[timestampColumnIndex]);

          let point: InstanceTablePoint = <InstanceTablePoint>{
            timestamp: timestamp,
            value: parseFloat(row[columnIndex]),
            counterName: column.columnName,
            instance: instance
          };

          tablePoints.push(point);
        });
      });
    }
    else {
      let counterNameColumnIndex = data.table.columns.findIndex(column => column.columnName.toLowerCase() === 'countername');
      let uniqueCounterNames = data.table.rows.map(row => row[counterNameColumnIndex]).filter((item, index, array) => array.indexOf(item) === index);
      // Only allow one value column => default is first number column
      let counterValueColumnIndex = data.table.columns.findIndex(column => DataTableDataType.NumberTypes.indexOf(column.dataType) >= 0);

      this.counters = uniqueCounterNames;

      uniqueCounterNames.forEach(counter =>
        instances.forEach(instance =>
          allSeries.push(<DetailedInstanceTimeSeries>{
            instance: instance,
            name: counter,
            series: <GraphSeries>{
              key: `${instance.displayName}-${counter}`,
              values: []
            }
          })
        )
      );

      data.table.rows.forEach(row => {

        let timestamp = moment.utc(row[timestampColumnIndex]);
        let instance = this._getInstanceFromRow(data.table, row);

        let point: InstanceTablePoint = <InstanceTablePoint>{
          timestamp: timestamp,
          value: parseFloat(row[counterValueColumnIndex]),
          instance: instance,
          counterName: data.table.columns[counterValueColumnIndex].columnName
        };

        tablePoints.push(point);
      });
    }

    allSeries.forEach(series => {

      let pointsForThisSeries =
        tablePoints
          .filter(point => point.instance.equals(series.instance) && point.counterName === series.name)
          .sort((b, a) => { return a.timestamp.diff(b.timestamp) });

      let pointToAdd = pointsForThisSeries.pop();

      for (var d = this.startTime.clone(); d.isBefore(this.endTime); d.add(this.timeGrainInMinutes, 'minutes')) {
        let value = this.defaultValue;

        if (pointToAdd && d.isSame(moment.utc(pointToAdd.timestamp))) {
          value = pointToAdd.value;

          pointToAdd = pointsForThisSeries.pop();
        }

        series.series.values.push(<GraphPoint>{ x: d.clone(), y: value });
      }
    });

    this.allSeries = allSeries;
  }

  private _getPointsFromValueColumns(instance: InstanceDetails, row: string[]) {

  }

  private _getInstanceFromRow(table: DataTableResponseObject, row: string[]) {
    let roleInstanceColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'roleinstance');
    let tenantColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'tenant');
    let machineNameColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'machinename');

    return new InstanceDetails(roleInstanceColumnIndex >= 0 ? row[roleInstanceColumnIndex] : '',
      tenantColumnIndex >= 0 ? row[tenantColumnIndex] : '',
      machineNameColumnIndex >= 0 ? row[machineNameColumnIndex] : '');
  }

  private _determineInstances(table: DataTableResponseObject) {
    let roleInstanceColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'roleinstance');
    let tenantColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'tenant');
    let machineNameColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'machinename');

    if (roleInstanceColumnIndex === -1 && tenantColumnIndex === -1 && machineNameColumnIndex === -1) {
      this.error = 'Could not find appropriate instance name columns';
      return [];
    }

    if (tenantColumnIndex === -1 && machineNameColumnIndex === -1) {
      this.warning = 'If you are only grouping instances by RoleInstance name, your query may be invalid for megastamps';
    }

    let roleInstances: InstanceDetails[] = [];
    table.rows.forEach(row => {
      let roleInstance = roleInstanceColumnIndex >= 0 ? row[roleInstanceColumnIndex] : '';
      let tenant = tenantColumnIndex >= 0 ? row[tenantColumnIndex] : '';
      let machineName = machineNameColumnIndex >= 0 ? row[machineNameColumnIndex] : '';

      if (!roleInstances.find(instance => instance.roleInstance === roleInstance && instance.tenant === tenant && instance.machineName === machineName)) {
        roleInstances.push(new InstanceDetails(roleInstance, tenant, machineName));
      }
    });

    return roleInstances;
  }

  private _getTimeStampColumn() {
    let timeStampColumn = this.renderingProperties.timestampColumnName ?
      this.dataTable.columns.findIndex(column => this.renderingProperties.timestampColumnName === column.columnName) :
      this.dataTable.columns.findIndex(column => column.dataType === DataTableDataType.DateTime);

    return timeStampColumn;
  }

  private _getRoleInstanceColumn() {
    let timeStampColumn = this.renderingProperties.roleInstanceColumnName ?
      this.dataTable.columns.findIndex(column => this.renderingProperties.roleInstanceColumnName === column.columnName) :
      this.dataTable.columns.findIndex(column => column.columnName === 'RoleInstance');

    this.renderingProperties.roleInstanceColumnName = this.dataTable.columns[timeStampColumn].columnName;

    return timeStampColumn;
  }

  private _getCounterNameColumn() {
    let timeStampColumn = this.renderingProperties.counterColumnName ?
      this.dataTable.columns.findIndex(column => this.renderingProperties.counterColumnName === column.columnName) :
      this.dataTable.columns.findIndex(column => column.columnName !== this.renderingProperties.roleInstanceColumnName
        && column.dataType == DataTableDataType.String);

    return timeStampColumn;
  }
}

interface InstanceTablePoint {
  timestamp: momentNs.Moment;
  value: number;
  counterName: string;
  instance: InstanceDetails;
}