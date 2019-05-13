import { Component, OnInit, Input } from '@angular/core';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { DetectorResponse, DiagnosticData } from '../../models/detector';
import { MatTableDataSource} from '@angular/material';
import {Changes} from '../../models/changesets';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { DiffEditorModel } from 'ngx-monaco-editor';
import * as momentNs from 'moment';
import { isBoolean, isString } from 'util';
const moment = momentNs;
  @Component({
    selector: 'changes-view',
    templateUrl: './changes-view.component.html',
    styleUrls: ['./changes-view.component.scss'],
    animations: [
        trigger('changeRowExpand', [
          state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
          state('expanded', style({height: '*'})),
          transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
      ],
  })
export class ChangesViewComponent implements OnInit {

    @Input() changesDataSet: DiagnosticData[];
    @Input() initiatedBy: string = '';
    changesResponse: DetectorResponse;
    dataSource: MatTableDataSource<Changes>;
    displayedColumns = ['level', 'time', 'displayName', 'description', 'initiatedBy'];
    expandedElement: Changes | null;
    tableItems: Changes[];
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

    constructor(private diagnosticService: DiagnosticService, private detectorControlService: DetectorControlService) { }

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
                this.tableItems.push({
                    "time":  moment(timestamp).format("MMM D YYYY, h:mm:ss a"),
                    "level": level,
                    "levelIcon": this.getIconForLevel(level),
                    "displayName": this.prepareDisplayValueForTable(displayName),
                    "description": description == null || description == "" ? "N/A" : description,
                    'oldValue': oldValue,
                    'newValue': newValue,
                    'initiatedBy': initiatedBy == null || initiatedBy == "" ? "N/A" : initiatedBy,
                    'originalModel': this.prepareValuesForDiffView(oldValue),
                    'modifiedModel': this.prepareValuesForDiffView(newValue)
                });
            });
            this.dataSource = new MatTableDataSource(this.tableItems);
        }
    }

    private prepareDisplayValueForTable(displayName: string): string {
        displayName = displayName.replace("D:\\home\\site\\wwwroot", "");
        return displayName;
    }

    // Prepare the data for diff view.
    private prepareValuesForDiffView(diffvalue: any): DiffEditorModel {
        try {
            let jsonObject1: any;
            if(isBoolean(diffvalue)) {
                return {
                    "code": diffvalue.toString(),
                    "language": 'text/plain'
                };
            }
            if(isString(diffvalue)) {
                diffvalue = diffvalue.replace("mtime", "Modified Time");
                diffvalue = diffvalue.replace("crtime", "Created Time");
                jsonObject1 = JSON.parse(diffvalue);
                if(jsonObject1.hasOwnProperty('content') && jsonObject1['content'] != null) {
                    return {
                        "code": jsonObject1['content'],
                        "language": 'text/plain'
                    };
                } return {
                    "code": JSON.stringify(jsonObject1, null, 2),
                    'language': 'json'
                };
            }
            if(diffvalue instanceof Object || diffvalue instanceof Array ) {
                if(diffvalue.hasOwnProperty('content') && diffvalue['content'] != null) {
                    return {
                        "code": diffvalue['content'],
                        "language": 'text/plain'
                    };
                } return {
                    // Needed for JSON Pretty
                    "code": JSON.stringify(diffvalue, null, 2),
                    "language": 'json'
                    };
            }
        // Exception is thrown when we try to parse string which is not a json, so just return text/plain
        } catch(ex) {
            return {
                "code": diffvalue,
                "language": 'text/plain'
            }
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

}

