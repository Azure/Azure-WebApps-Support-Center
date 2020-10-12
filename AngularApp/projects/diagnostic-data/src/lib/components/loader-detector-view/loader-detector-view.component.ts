import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'loader-detector-view',
  templateUrl: './loader-detector-view.component.html',
  styleUrls: ['./loader-detector-view.component.scss']
})
export class LoaderDetectorViewComponent implements OnInit {

  message: string = "loading detector view";
  constructor() { }

  ngOnInit() {
  }

}
