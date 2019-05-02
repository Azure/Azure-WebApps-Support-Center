import { Component, OnInit, Input } from '@angular/core';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { DetectorResponse, DiagnosticData } from '../../models/detector';
import { MatTableDataSource} from '@angular/material';
import {Changes} from '../../models/changesets';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { DiffEditorModel } from 'ngx-monaco-editor';
import * as momentNs from 'moment';
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
        console.log('changes view initialized');
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
                let description = row.hasOwnProperty("descrption") ? row["descrption"] : row[4];
                let oldValue = row.hasOwnProperty("oldValue") ? row["oldValue"] : row[5];
                let newValue = row.hasOwnProperty("newValue") ? row["newValue"] : row[6];
                let initiatedBy = row.hasOwnProperty("initiatedBy") ? row["initiatedBy"] : row[7];
                let displayName = row.hasOwnProperty("displayName") ? row["displayName"] : row[3];
                let timestamp = row.hasOwnProperty("timeStamp") ? row["timeStamp"] : row[0];
                this.tableItems.push({
                    "time":  momentNs(timestamp).format("MMM D YYYY, h:mm:ss a"),
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
            if(diffvalue instanceof Object || diffvalue instanceof Array ) {
                return {
                    // Needed for JSON Pretty
                    "code": JSON.stringify(diffvalue, null, 2),
                    "language": 'json'
                    };
            }
            let jsonObject = JSON.parse(diffvalue);
            if(jsonObject.hasOwnProperty('content') && jsonObject['content'] != null) {
                return {
                    "code": jsonObject['content'],
                    "language": 'text/plain'
                };
        } else {
            diffvalue = diffvalue.replace("mtime", "Modified Time");
            diffvalue = diffvalue.replace("crtime", "Created Time");
           return {
                // Needed for JSON Pretty
                "code": JSON.stringify(JSON.parse(diffvalue), null, 2),
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

