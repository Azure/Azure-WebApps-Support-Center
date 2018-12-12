import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tab-common',
  templateUrl: './tab-common.component.html',
  styleUrls: ['./tab-common.component.scss']
})
export class TabCommonComponent implements OnInit {

  contentHeight: string;
  constructor() {
    this.contentHeight = (window.innerHeight - 112) + 'px';
  }

  ngOnInit() {
  }
}
