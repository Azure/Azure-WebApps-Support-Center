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
    if (this.TimeSpan && this.TimeSpan !== ''){
      this.Seconds = this._formattingService.timespanToSeconds(this.TimeSpan);
    }    
  }

  @Input() TimeSpan: string;
  @Input() placeholder:string;
  @Output() TimeSpanChange = new EventEmitter<string>();
  Seconds:number;

  updateTimeSpan(val){
      this.Seconds = val;
      let timeSpan = this._formattingService.secondsToTimespan(this.Seconds);
      this.TimeSpanChange.emit(timeSpan);      
  }

}
