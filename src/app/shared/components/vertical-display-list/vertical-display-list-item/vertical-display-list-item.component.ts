import { Component, Input, OnInit, ViewChildren } from '@angular/core';
import { VerticalDisplayListMetaData } from '../vertical-display-list.component';
import { SolutionTypeTag } from '../../../models/solution-type-tag';
import { BehaviorSubject } from 'rxjs';


@Component({
    selector: 'vertical-display-list-item',
    templateUrl: 'vertical-display-list-item.component.html',
    styleUrls: ['../vertical-display-list.component.css']
})
export class VerticalDisplayListItemComponent {
    @Input() name: string;
    @Input() tags: SolutionTypeTag[];
    @Input() index: number;

    public metaData: VerticalDisplayListMetaData;

    ngOnInit() {
        this.metaData = <VerticalDisplayListMetaData>{
            title: this.name,
            tags: this.tags,
            isSelected: this.index === 0
        };
    }

}