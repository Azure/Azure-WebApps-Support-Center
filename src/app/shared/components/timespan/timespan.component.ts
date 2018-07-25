import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormattingService } from '../../services/formatting.service';

@Component({
  selector: 'timespan',
  templateUrl: './timespan.component.html',
  styleUrls: ['./timespan.component.css']
})
export class TimespanComponent implements OnInit {

  constructor(private _formattingService : FormattingService) { }

  ngOnInit() {
    if (this.timeSpan && this.timeSpan !== ''){
      this.Seconds = this._formattingService.timespanToSeconds(this.timeSpan);
    }    
  }

  @Input() timeSpan: string;
  @Input() placeholder:string;
  @Input() allowZeroValue:boolean;
  
  @Output() timeSpanChange = new EventEmitter<string>();
  //@Output() timeSpanValueChanged = new EventEmitter<string>();

  Seconds:number;

  updateTimeSpan(val){
      this.Seconds = val;
      let timeSpan = this._formattingService.secondsToTimespan(this.Seconds);
      this.timeSpanChange.emit(timeSpan);      
  }

  // updateTimeSpanValue(val){
  //   this.Seconds = val;
  //   let timeSpan = this._formattingService.secondsToTimespan(val);
  //   this.timeSpanValueChanged.emit(timeSpan);
  // }

}
