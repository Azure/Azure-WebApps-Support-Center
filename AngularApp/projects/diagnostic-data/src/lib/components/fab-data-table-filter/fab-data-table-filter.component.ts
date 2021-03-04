import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TableFilter } from '../../models/detector';

@Component({
  selector: 'fab-data-table-filter',
  templateUrl: './fab-data-table-filter.component.html',
  styleUrls: ['./fab-data-table-filter.component.scss']
})
export class FabDataTableFilterComponent implements OnInit {
  @Input() tableFilter: TableFilter
  @Output() filterChanged: EventEmitter<string> = new EventEmitter<string>();
  constructor() { }

  ngOnInit() {
  }

}
