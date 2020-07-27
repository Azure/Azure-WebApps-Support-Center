import { Component, OnInit, Input, ContentChildren, QueryList } from '@angular/core';
import { CollapsibleListItemComponent } from '../collapsible-list-item.component';

@Component({
  selector: 'collapsible-list-fabric',
  templateUrl: './collapsible-list-fabric.component.html',
  styleUrls: ['./collapsible-list-fabric.component.scss']
})
export class CollapsibleListFabricComponent  {

  @Input() title: string;
  @Input() collapsed: boolean;

  @ContentChildren(CollapsibleListItemComponent) listItemComponents: QueryList<CollapsibleListItemComponent>;

  constructor() {
  }
}
