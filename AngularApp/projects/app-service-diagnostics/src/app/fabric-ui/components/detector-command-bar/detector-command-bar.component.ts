import { Component } from '@angular/core';
import {
  IContextualMenuProps,
} from 'office-ui-fabric-react';
import { Globals } from '../../../globals';
import { DetectorControlService } from 'projects/diagnostic-data/src/lib/services/detector-control.service';

@Component({
  selector: 'detector-command-bar',
  templateUrl: './detector-command-bar.component.html',
  styleUrls: ['./detector-command-bar.component.scss']
})
export class DetectorCommandBarComponent {
  dropdownStyles = {
    openPanel: false
  };



  time: string;


  // commandbar related
  // commandbarStyles = {
  //   backgroundColor: "blue"
  // };
  listenObj: any;
  dropdownOpen: boolean = true;



  itemProps1: Partial<IContextualMenuProps> = {
    onItemClick: (ev, item) => {
      return false;
    }
  };


  constructor(private globals: Globals, private detectorControlService: DetectorControlService) { }


  toggleOpenState() {
    this.globals.openGeniePanel = !this.globals.openGeniePanel;
    console.log("toggle panel, isOpen:", this.globals.openGeniePanel);
  }


  sendFeedback() {
    this.globals.openFeedback = !this.globals.openFeedback;
  }

  refreshPage() {
    this.detectorControlService.refresh();
  }

  toggleOpenTimePicker() {
    this.globals.openTimePicker = !this.globals.openTimePicker;
  }

  updateMessage(s: string) {
    this.time = s;
  }

  showSearch() {

  }

  onCopyClicked() {

  }
}
