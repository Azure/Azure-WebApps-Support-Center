import { Component, OnInit } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { Globals } from '../../../globals';

@Component({
  selector: 'create-storage-account-panel',
  templateUrl: './create-storage-account-panel.component.html',
  styleUrls: ['./create-storage-account-panel.component.scss']
})
export class CreateStorageAccountPanelComponent implements OnInit {

  type: PanelType = PanelType.custom;
  width: string = "850px";
  
  constructor(public globals: Globals) { }

  ngOnInit() {
  }

  dismissedHandler(){
    this.globals.openCreateStorageAccountPanel = false;
  }

}
