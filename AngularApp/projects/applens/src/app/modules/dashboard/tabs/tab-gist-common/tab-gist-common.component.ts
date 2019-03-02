import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tab-gist-common',
  templateUrl: './tab-gist-common.component.html',
  styleUrls: ['./tab-gist-common.component.scss']
})
export class TabGistCommonComponent implements OnInit {
  contentHeight: string;
  constructor() { }

  ngOnInit() {
    this.contentHeight = (window.innerHeight - 112) + 'px';
  }
}
