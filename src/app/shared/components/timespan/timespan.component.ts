import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormatHelper } from '../../utilities/formattingHelper';

@Component({
  selector: 'timespan',
  templateUrl: './timespan.component.html',
  styleUrls: ['./timespan.component.css']
})
export class TimespanComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    if (this.timeSpan && this.timeSpan !== ''){
      this.Seconds = FormatHelper.timespanToSeconds(this.timeSpan);
    }    
  }

  @Input() timeSpan: string;
  @Input() placeholder:string;
  @Input() allowZeroValue:boolean;
  
  @Output() timeSpanChange = new EventEmitter<string>();

  Seconds:number;

  updateTimeSpan(val){
      this.Seconds = val;
      let timeSpan = FormatHelper.secondsToTimespan(this.Seconds);
      this.timeSpanChange.emit(timeSpan);      
  }

}
