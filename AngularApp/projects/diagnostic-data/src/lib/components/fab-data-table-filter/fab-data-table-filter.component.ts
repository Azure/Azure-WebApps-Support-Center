import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DirectionalHint, IChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react';
import { TableFilterSelectionOption, TableFilter } from '../../models/detector';

const all = "all";

@Component({
  selector: 'fab-data-table-filter',
  templateUrl: './fab-data-table-filter.component.html',
  styleUrls: ['./fab-data-table-filter.component.scss']
})
export class FabDataTableFilterComponent implements OnInit {
  TableFilterSelectionOption = TableFilterSelectionOption;
  @Input() tableFilter: TableFilter;
  @Input() options: string[];
  //To generate unique element id for call out
  filterId: string;
  filterSelector: string;
  @Input() index: number;
  @Input() tableId: number;

  @Output() onFilterUpdate: EventEmitter<Set<string>> = new EventEmitter<Set<string>>();
  name: string = "";
  filterOption: TableFilterSelectionOption = TableFilterSelectionOption.Single;
  selected: Set<string> = new Set<string>();
  optionsWithFormattedName: { name: string, formattedName: string }[] = [];

  //For single choice
  optionsForSingleChoice: IChoiceGroupOption[] = [];
  selectedKey: string = "";
  displayName: string = "";
  isCallOutVisible: boolean = false;
  constructor() { }

  ngOnInit() {
    this.displayName = `${this.tableFilter.columnName} : ${all}`;
    this.filterOption = this.tableFilter.selectionOption;

    this.options.sort();

    this.filterId = `fab-data-table-filter-${this.tableId}-${this.index}`;
    this.filterSelector = `#${this.filterId}`;

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
      this.selected = new Set(this.options);
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
    return this.options.length === this.selected.size;
  }

  //For single selection
  initForSingleSelect() {    
    this.selectedKey = all;
    this.optionsForSingleChoice.push({
      key: all,
      text: "All",
      onClick: () => {
        this.selected = new Set(this.options);
        this.selectedKey = all;
      }
    });
    this.optionsWithFormattedName.forEach(option => {
      this.optionsForSingleChoice.push({
        key: option.formattedName,
        text: option.formattedName,
        onClick: () => {
          this.selected.clear();
          this.selectedKey = option.formattedName;
          this.selected.add(option.name);
        },
      });
    });
  }

  updateTableWithOptions() {
    this.updateDisplayName();
    this.emitSelectedOption();
    this.closeCallout();
  }

  private formatOptionName(name: string): string {
    let formattedString = name;
    //remove empty space and <i> tag
    formattedString = formattedString.replace(/&nbsp;/g, "");
    formattedString = formattedString.replace(/<i.*><\/i>/g, "");
    return formattedString;
  }

  toggleCallout() {
    this.isCallOutVisible = !this.isCallOutVisible;
  }

  closeCallout() {
    this.isCallOutVisible = false;
  }

  updateDisplayName() {
    if (this.filterOption === TableFilterSelectionOption.Single) {
      this.displayName = `${this.tableFilter.columnName} : ${this.selectedKey}`;
    } else if (this.filterOption === TableFilterSelectionOption.Multiple) {
      if (this.selected.size === 0 || this.selected.size === this.options.length) {
        //Selected nothing will be same as selected all as for display
        this.displayName = `${this.tableFilter.columnName} : ${all}`;
      } else if (this.selected.size == 1) {
        const selectedName = Array.from(this.selected)[0];
        const formattedSelectionName = this.optionsWithFormattedName.find(o => selectedName === o.name).formattedName;
        this.displayName = `${this.tableFilter.columnName} : ${formattedSelectionName}`;
      } else if (this.selected.size < this.options.length) {
        this.displayName = `${this.tableFilter.columnName} : ${this.selected.size} of ${this.options.length} selected`;
      }
    }
  }

  emitSelectedOption() {
    //For multiple selection,if selected nothing then it will show as selected nothing ,but for updating table it will be same as selected everything
    if (this.filterOption === TableFilterSelectionOption.Multiple && this.selected.size === 0) {
      this.onFilterUpdate.emit(new Set(this.options));
    } else {
      this.onFilterUpdate.emit(this.selected);
    }
  }
}
