import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, AfterViewInit, ContentChildren, QueryList } from '@angular/core';
import { IAppAnalysisResponse, IAbnormalTimePeriod } from '../../models/appanalysisresponse';
import { Observable } from 'rxjs/Observable';
import { ExpandableListItemComponent } from './expandable-list-item.component'
import 'rxjs/add/operator/map';

@Component({
    selector: 'expandable-list',
    templateUrl: 'expandable-list.component.html',
    styleUrls: ['expandable-list.component.css']
})
export class ExpandableListComponent implements AfterViewInit {

    @Input() title: string;

    @ContentChildren(ExpandableListItemComponent) listItemComponents: QueryList<ExpandableListItemComponent>; 

    constructor(){ }

    ngAfterViewInit(){

    }
}