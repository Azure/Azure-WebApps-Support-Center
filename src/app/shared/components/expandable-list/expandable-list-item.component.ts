import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IAppAnalysisResponse, IAbnormalTimePeriod } from '../../models/appanalysisresponse';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Component({
    selector: 'expandable-list-item',
    templateUrl: 'expandable-list-item.component.html',
    styleUrls: ['expandable-list-item.component.css']
})
export class ExpandableListItemComponent {

    @Input() title: string;

    @Input() titleColor: string;

    @Input() selected: boolean;

    @Output() selectedChange: EventEmitter<number> = new EventEmitter<number>();

    @Output() onSelected: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor(){ 
        this.titleColor= '#000000';
    }

    toggleView() {
        this.selected = ! this.selected;
        this.onSelected.emit(this.selected);
    }
}