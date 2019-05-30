import { Component, Input, OnInit } from '@angular/core';
import { RecommendedUtterance } from '../../../../../../diagnostic-data/src/public_api';

@Component({
  selector: 'search-term-addition',
  templateUrl: './search-term-addition.component.html',
  styleUrls: ['./search-term-addition.component.scss']
})
export class SearchTermAdditionComponent implements OnInit {
  @Input() allUtterances: any[];
  @Input() recommendedUtterances: RecommendedUtterance[];
  @Input() utteranceInput: string;
  
  displayError: boolean = false;

  constructor() {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  addUtterance(utterance: RecommendedUtterance) {
    var index = this.allUtterances.indexOf(utterance.sampleUtterance);
    if (index<0) {
      this.allUtterances.unshift(utterance.sampleUtterance);
      var idx = this.recommendedUtterances.indexOf(utterance);
      if (idx >= 0) {
        this.recommendedUtterances.splice(idx, 1);
      }
    }
  }

  createUtterance() {
    if (this.utteranceInput.length < 5) {
      this.displayError = true;
      return;
    }
    this.displayError = false;
    this.allUtterances.unshift({ "text": this.utteranceInput.valueOf(), "links": [] });
    this.utteranceInput = "";
  }

  removeUtterance(utterance: any) {
    var index = this.allUtterances.indexOf(utterance);
    this.allUtterances.splice(index, 1);
  }
}
