import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react';
import { TableFilterSelectionOption, TableFilter } from '../../models/detector';

@Component({
  selector: 'fab-data-table-filter',
  templateUrl: './fab-data-table-filter.component.html',
  styleUrls: ['./fab-data-table-filter.component.scss']
})
export class FabDataTableFilterComponent implements OnInit {
  TableFilterSelectionOption = TableFilterSelectionOption;
  @Input() tableFilter: TableFilter;
  @Input() options: string[];
  @Output() onFilterUpdate: EventEmitter<Set<string>> = new EventEmitter<Set<string>>();
  name: string = "";
  filterOption: TableFilterSelectionOption = TableFilterSelectionOption.Single;
  selected: Set<string> = new Set<string>();
  optionsWithFormattedName: { name: string, formattedName: string }[] = [];

  //For single choice
  optionsForSingleChoice: IChoiceGroupOption[] = [];
  constructor() { }

  ngOnInit() {
    this.name = this.tableFilter.columnName;
    this.filterOption = this.tableFilter.selectionOption;

    this.options.forEach(option => {
      this.optionsWithFormattedName.push({ name: option, formattedName: this.formatOptionName(option) });
    });

    if (this.filterOption === TableFilterSelectionOption.Single) {
      this.initForSingleSelect();
    }
  }

  //For multiple selection
  toggleSelectAll(checked: boolean) {
    if (checked) {
      //Selected All
      for (let option of this.options) {
        this.selected.add(option);
      }
    } else {
      //Deselected All
      this.selected.clear();
    }
  }

  toggleSelectOption(checked: boolean, index: number) {
    const optionName = this.optionsWithFormattedName[index].name;
    if (checked) {
      this.selected.add(optionName);
    } else {
      this.selected.delete(optionName);
    }
  }

  getCheckedStatus(index: number): boolean {
    const optionName = this.optionsWithFormattedName[index].name;
    return this.selected.has(optionName);
  }

  getSelectedAllStatus(): boolean {
    for (let option of this.options) {
      if (!this.selected.has(option)) return false;
    }
    return true;
  }

  //For single selection
  initForSingleSelect() {
    this.optionsWithFormattedName.forEach((option, index) => {
      this.optionsForSingleChoice.push({
        key: option.formattedName,
        text: option.formattedName,
        defaultChecked: index === 0,
        onClick: () => {
          this.selected.clear();
          this.selected.add(option.name);
        },
      });
    });
  }

  updateTableWithOptions() {
    this.onFilterUpdate.emit(this.selected);
  }

  private formatOptionName(name: string): string {
    let formattedString = name;
    //remove empty space and <i> tag
    formattedString = formattedString.replace(/&nbsp;/g,"");
    formattedString = formattedString.replace(/<i.*><\/i>/g,"");
    return formattedString;
  }

}
