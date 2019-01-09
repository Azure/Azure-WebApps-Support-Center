import { Component, OnInit, Inject, Input } from '@angular/core';
import { CommsService } from '../../services/comms.service';
import { Communication, CommunicationStatus } from '../../models/communication';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import * as momentNs from 'moment';

const moment = momentNs;

@Component({
  selector: 'comm-alert',
  templateUrl: './comm-alert.component.html',
  styleUrls: ['./comm-alert.component.scss']
})
export class CommAlertComponent implements OnInit {

  private activeAlertTitle: string = 'An Azure service outage may be impacting this subscription. (Issue : {title})';
  private resolvedAlertTitle: string =
    'An Azure service outage that was impacting this subscription was recently resolved. (Issue : {title})';
  private azureServiceCommList: Communication[];

  @Input() autoExpand: boolean = false;
  public commAlertTitle: string;
  public commAlertToShow: Communication = null;
  public isAlertExpanded: boolean = false;
  public commPublishedTime: string;
  public impactedServices: string;
  public impactedRegions: string;
  public isPublic: boolean;

  constructor(private commsService: CommsService, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    this.commAlertToShow = null;
    this.commAlertTitle = '';
    this.isPublic = config.isPublic;
    this.azureServiceCommList = [];
  }

  ngOnInit() {

    this.commsService.getServiceHealthCommunications().subscribe((commsList: Communication[]) => {
      this.azureServiceCommList = commsList;
      const commAlert = commsList.find((comm: Communication) => comm.isAlert === true);
      if (commAlert) {
        this.commAlertToShow = commAlert;
        this.isAlertExpanded = this.autoExpand && this.commAlertToShow.isExpanded;
        this.commPublishedTime = moment.utc(this.commAlertToShow.publishedTime).format('YYYY-MM-DD HH:mm A');
        if (commAlert.status === CommunicationStatus.Active) {
          this.commAlertTitle = this.activeAlertTitle;
        } else {
          this.commAlertTitle = this.resolvedAlertTitle;
        }

        this.commAlertTitle = this.commAlertTitle.replace('{title}', commAlert.title);
        this._getImpactedServices();
      }
    });
  }

  private _getImpactedServices() {

    let impactedServices: string[] = [];
    let impactedRegions: string[] = [];

    const allCommsForImpactingIncident = this.azureServiceCommList.filter(x => x.incidentId === this.commAlertToShow.incidentId);
    allCommsForImpactingIncident.forEach(item => {
      impactedServices = impactedServices.concat(item.impactedServices.map(y => y.name));

      const regions = item.impactedServices.map(z => z.regions);
      impactedRegions = impactedRegions.concat(...regions);

    });

    const impactedServicesArray = impactedServices.filter((value, index, arr) => arr.indexOf(value) === index);

    this.impactedServices = impactedServicesArray && impactedServicesArray.toString();
    const uniqueRegions = impactedRegions.filter((value, index, arr) => arr.indexOf(value) === index);

    if (uniqueRegions.length > 3) {
      const firstThreeRegions = uniqueRegions.slice(0, 3);
      this.impactedRegions = firstThreeRegions && firstThreeRegions.toString().concat(`(+${uniqueRegions.length - 3} more)`);
    } else {
      this.impactedRegions = uniqueRegions && uniqueRegions.toString();
    }
  }
}
