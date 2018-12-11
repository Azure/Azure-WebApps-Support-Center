import { GraphSeries } from "../components/nvd3-graph/nvd3-graph.component";
import * as momentNs from 'moment';

export interface TimeSeries {
  name: string;
  series: GraphSeries
}

export interface InstanceTimeSeries extends TimeSeries {
  aggregated: boolean;
  instance: string;
}

export interface DetailedInstanceTimeSeries extends TimeSeries {
  instance: InstanceDetails;
}

export class InstanceDetails {
  roleInstance: string; // SmallDedid...
  tenant: string; // Stamp Tenant
  machineName: string; // RD...

  displayName: string;

  constructor(roleInstance, tenant, machinename) {
    this.roleInstance = roleInstance;
    this.tenant = tenant;
    this.machineName = machinename;

    this.displayName = this._getDisplayName();
  }

  private _getDisplayName() {
    if (this.machineName && this.machineName!== '') {
      return this.machineName;
    }

    let truncatedTenant = this.tenant && this.tenant != '' ? this.tenant.substr(0,4) + '-' : '';
    let truncatedInstance = this.roleInstance.replace('DedicatedWebWorkerRole_IN', '').replace('DedicatedLinuxWebWorkerRole_IN', '');

    return `${truncatedTenant}${truncatedInstance}`;
  }

  equals(instance: InstanceDetails): boolean {
    return this.roleInstance === instance.roleInstance &&
      this.tenant === instance.tenant &&
      this.machineName === instance.machineName;
  }
}

export interface TablePoint {
  timestamp: momentNs.Moment;
  value: number;
  column: string;
  counterName: string;
}