import { Component, OnInit, Input } from '@angular/core';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { DetectorResponse, DiagnosticData } from '../../models/detector';
import { MatTableDataSource} from '@angular/material';
import { Change } from '../../models/changesets';
import { animate, state, style, transition, trigger } from '@angular/animations';
import * as momentNs from 'moment';
import { ChangeAnalysisUtilities } from '../../utilities/changeanalysis-utilities';
const moment = momentNs;
  @Component({
    selector: 'changes-view',
    templateUrl: './changes-view.component.html',
    styleUrls: ['./changes-view.component.scss'],
    animations: [
        trigger('changeRowExpand', [
          state('collapsed', style({height: '0px', minHeight: '0', visibility: 'hidden'})),
          state('expanded', style({height: '*', visibility: 'visible'})),
          transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
      ],
  })
export class ChangesViewComponent implements OnInit {

    @Input() changesetId: string = '';
    @Input() changesDataSet: DiagnosticData[];
    @Input() initiatedBy: string = '';
    changesResponse: DetectorResponse;
    dataSource: MatTableDataSource<Change>;
    displayedColumns = ['level', 'time', 'displayName', 'description', 'initiatedBy'];
    expandedElement: Change | null;
    tableItems: Change[];
    options = {
        theme: 'vs',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: {
          enabled: false
        },
        folding: true
      };
    changeLevelIcon = [{
        "imgSrc": "../../../assets/img/normalicon.png",
        "displayValue": "Normal"
    }, {
        "imgSrc": "../../../assets/img/importanticon.png",
        "displayValue": "Important"
    }, {
        "imgSrc": "../../../assets/img/noiseicon.png",
        "displayValue": "Noise"
    }];

    private _changeFeedbacks: Map<Change, boolean> = new Map<Change, boolean>();

    constructor(private diagnosticService: DiagnosticService, private detectorControlService: DetectorControlService, private telemetryService: TelemetryService) { }

    ngOnInit() {
        this.tableItems = [];
        let changesTable = this.changesDataSet[0].table;
        if(changesTable) {
            this.parseChangesData(changesTable.rows);
        }
    }

    private parseChangesData(rows: any[][]) {
        if(rows.length > 0) {
            rows.forEach(row => {
                let level = row.hasOwnProperty("level") ? row["level"] : row[2];
                let description = row.hasOwnProperty("description") ? row["description"] : row[4];
                let oldValue = row.hasOwnProperty("oldValue") ? row["oldValue"] : row[5];
                let newValue = row.hasOwnProperty("newValue") ? row["newValue"] : row[6];
                let initiatedBy = this.initiatedBy;
                let displayName = row.hasOwnProperty("displayName") ? row["displayName"] : row[3];
                let timestamp = row.hasOwnProperty("timeStamp") ? row["timeStamp"] : row[0];
                let jsonPath = row.hasOwnProperty("jsonPath") ? row["jsonPath"] : row[8];
                this.tableItems.push({
                    "time":  moment(timestamp).format("MMM D YYYY, h:mm:ss a"),
                    "level": level,
                    "levelIcon": this.getIconForLevel(level),
                    "displayName":ChangeAnalysisUtilities.prepareDisplayValueForTable(displayName),
                    "description": description == null || description == "" ? "N/A" : description,
                    'oldValue': oldValue,
                    'newValue': newValue,
                    'initiatedBy': initiatedBy == null || initiatedBy == "" ? "N/A" : initiatedBy,
                    'jsonPath': jsonPath,
                    'originalModel': ChangeAnalysisUtilities.prepareValuesForDiffView(oldValue),
                    'modifiedModel': ChangeAnalysisUtilities.prepareValuesForDiffView(newValue)
                });
            });
            this.dataSource = new MatTableDataSource(this.tableItems);
        }
    }

    private getIconForLevel(level: string): string {
        switch(level){
            case "Normal":
            return this.changeLevelIcon[0].imgSrc;
            case "Important":
            return this.changeLevelIcon[1].imgSrc;
            case "Noisy":
            return this.changeLevelIcon[2].imgSrc;
            default:
            return this.changeLevelIcon[0].imgSrc;
        }
    }

    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    getFeedbackButtonClass(changeItem: Change, isHelpfulButton: boolean): string[] {
        let classNames: string[] = ["feedback-button"];

        let feedbackProvided = this._changeFeedbacks.has(changeItem);
        if (feedbackProvided) {
            classNames.push("disabled");

            let changeHelpful = this._changeFeedbacks.get(changeItem);
            if ((isHelpfulButton && !changeHelpful)
                || (!isHelpfulButton && changeHelpful)) {
                classNames.push("greyed-out");
            }
        }

        return classNames;
    }

    sendFeedback(changeItem: Change, isHelpful: boolean): void {
        let feedbackProvided = this._changeFeedbacks.has(changeItem);
        if (feedbackProvided) {
            return;
        }

        this._changeFeedbacks.set(changeItem, isHelpful);

        let eventProps = {
            'isHelpful': isHelpful.toString(),
            'changeLevel': changeItem.level,
            'dataSource': ChangeAnalysisUtilities.getDataSourceFromChangesetId(this.changesetId),
            'displayName': changeItem.displayName,
            'jsonPath': changeItem.jsonPath,
            'changeTimestamp': changeItem.time,
            'oldValueLength': changeItem.originalModel.code.length.toString(),
            'newValueLength': changeItem.modifiedModel.code.length.toString()
        };
        this.telemetryService.logEvent(TelemetryEventNames.ChangeAnalysisChangeFeedbackClicked, eventProps);
   }
}

