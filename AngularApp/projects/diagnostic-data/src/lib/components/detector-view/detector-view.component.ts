import { ResourceService } from './../../../../../applens/src/app/shared/services/resource.service';
import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DetectorResponse, RenderingType } from '../../models/detector';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import * as momentNs from 'moment';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { DetectorControlService } from '../../services/detector-control.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

const moment = momentNs;

@Component({
  selector: 'detector-view',
  templateUrl: './detector-view.component.html',
  styleUrls: ['./detector-view.component.scss'],
  animations: [
    trigger('expand', [
      state('hidden', style({ height: '0px' })),
      state('shown', style({ height: '*' })),
      transition('* => *', animate('.25s')),
      transition('void => *', animate(0))
    ])
  ]
})
export class DetectorViewComponent implements OnInit {

  detectorDataLocalCopy: DetectorResponse;
  errorState: any;
  isPublic: boolean;

  buttonViewVisible: boolean = false;
  buttonViewActiveComponent: string;

  readonly Feedback: string = 'Feedback'
  readonly Report: string = 'Report'

  private detectorResponseSubject: BehaviorSubject<DetectorResponse> = new BehaviorSubject<DetectorResponse>(null);
  private errorSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  public detectorEventProperties: { [name: string]: string };
  public ratingEventProperties: { [name: string]: string };
  public authorEmails: string;
  public insightsListEventProperties = {};
  public currentSiteString = `Current Site: ${window.location.href} `;

  @Input()
  set detectorResponse(value: DetectorResponse) {
    this.detectorResponseSubject.next(value);
  }

  @Input()
  set error(value: any) {
    this.errorSubject.next(value);
  }

  @Input() startTime: momentNs.Moment;
  @Input() endTime: momentNs.Moment;

  @Input() showEdit: boolean = true;
  @Input() insideDetectorList: boolean = false;
  @Input() parentDetectorId: string = '';
  @Input() isSystemInvoker: boolean = false;
  @Input() authorInfo: string = '';
  @Input() feedbackDetector: string = '';

  feedbackButtonLabel: string = 'Send Feedback';

  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private telemetryService: TelemetryService,
    private detectorControlService: DetectorControlService) {
    this.isPublic = config && config.isPublic;
    this.feedbackButtonLabel = this.isPublic ? 'Send Feedback' : 'Rate Detector';
  }

  ngOnInit() {
    this.loadDetector();

    this.detectorControlService.update.subscribe(validUpdate => {
      if (validUpdate) {

      }
    });

    this.errorSubject.subscribe((data: any) => {
      this.errorState = data;
    });

    // The detector name can be retrieved from  url column of application insight resource pageviews table.
    if (!this.insideDetectorList) {
      this.telemetryService.logPageView(TelemetryEventNames.DetectorViewLoaded);
    }
  }

  protected loadDetector() {
    this.detectorResponseSubject.subscribe((data: DetectorResponse) => {
      this.detectorDataLocalCopy = data;
      if (data) {
        this.detectorEventProperties = {
          'StartTime': String(this.startTime),
          'EndTime': String(this.endTime),
          'DetectorId': data.metadata.id,
          'ParentDetectorId': this.parentDetectorId,
          'Url': window.location.href
        };

        this.ratingEventProperties = {
          'DetectorId': data.metadata.id,
          'Url': window.location.href
        }

        this.feedbackDetector = this.isSystemInvoker ? this.feedbackDetector : data.metadata.id;

        if (!this.isSystemInvoker && data.metadata && data.metadata.author) {
          this.authorInfo = data.metadata.author;
        }

        if (this.authorInfo !== '') {
          const separators = [' ', ',', ';', ':'];
          const authors = this.authorInfo.split(new RegExp(separators.join('|'), 'g'));
          const authorsArray: string[] = [];
          authors.forEach(author => {
            if (author && author.length > 0) {
              authorsArray.push(`${author}@microsoft.com`);
            }
          });
          this.authorEmails = authorsArray.join(';');
        }

        this.buttonViewActiveComponent = null;
        this.buttonViewVisible = false;

        this.logInsights(data);

      }
    });
  }

  toggleButtonView(feature: string) {
    if (this.buttonViewVisible) {
      this.buttonViewVisible = false;
      if (this.buttonViewActiveComponent !== feature) {
        setTimeout(() => {
          this.buttonViewActiveComponent = feature;
          this.buttonViewVisible = true;
        }, 250)
      }
      else {
        setTimeout(() => {
          this.buttonViewActiveComponent = null;
        }, 250)
      }
    }
    else {
      this.buttonViewActiveComponent = feature;
      this.buttonViewVisible = true;
    }
  }

  protected logInsights(data: DetectorResponse) {
    if (data.dataset) {
      let totalCount: number = 0;
      let successCount: number = 0;
      let criticalCount: number = 0;
      let warningCount: number = 0;
      let infoCount: number = 0;
      let defaultCount: number = 0;
      const insightsList = [];
      const insightsNameList: string[] = [];

      const statusColumnIndex = 0;
      const insightColumnIndex = 1;
      const isExpandedIndex = 4;

      data.dataset.forEach(dataset => {
        if (dataset.renderingProperties && dataset.renderingProperties.type === RenderingType.Insights) {
          dataset.table.rows.forEach(row => {
            if ((insightsNameList.find(insightName => insightName === row[insightColumnIndex])) == null) {
              {
                const isExpanded: boolean = row.length > isExpandedIndex ? row[isExpandedIndex].toLowerCase() === 'true' : false;
                const insightInstance = {
                  'Name': row[insightColumnIndex],
                  'Status': row[statusColumnIndex],
                  'IsExpandedByDefault': isExpanded
                };
                insightsList.push(insightInstance);
                insightsNameList.push(row[insightColumnIndex]);

                switch (row[statusColumnIndex]) {
                  case 'Critical':
                    criticalCount++;
                    break;
                  case 'Warning':
                    warningCount++;
                    break;
                  case 'Success':
                    successCount++;
                    break;
                  case 'Info':
                    infoCount++;
                    break;
                  default:
                    defaultCount++;
                }
              }
            }
          });
        }
      });

      totalCount = insightsList.length;

      const insightSummary = {
        'Total': totalCount,
        'Critical': criticalCount,
        'Warning': warningCount,
        'Success': successCount,
        'Info': infoCount,
        'Default': defaultCount
      };

      this.insightsListEventProperties = {
        'InsightsList': JSON.stringify(insightsList),
        'InsightsSummary': JSON.stringify(insightSummary)
      };

      this.logEvent(TelemetryEventNames.InsightsSummary, this.insightsListEventProperties);
    }
  }


  protected logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
    for (const id of Object.keys(this.detectorEventProperties)) {
      if (this.detectorEventProperties.hasOwnProperty(id)) {
        eventProperties[id] = String(this.detectorEventProperties[id]);
      }
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }
}
