import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { AutohealingService } from '../../services/autohealing.service';

@Component({
  selector: 'timespan',
  templateUrl: './timespan.component.html',
  styleUrls: ['./timespan.component.css']
})
export class TimespanComponent implements OnInit {

  constructor(private _autoHealingService : AutohealingService) { }

  ngOnInit() {
    if (this.TimeSpan && this.TimeSpan !== ''){
      this.Seconds = this._autoHealingService.timespanToSeconds(this.TimeSpan);
    }    
  }

  @Input() TimeSpan: string;
  @Input() placeholder:string;
  @Output() TimeSpanChange = new EventEmitter<string>();
  Seconds:number;

  updateTimeSpan(val){
      this.Seconds = val;
      let timeSpan = this._autoHealingService.secondsToTimespan(this.Seconds);
      this.TimeSpanChange.emit(timeSpan);      
  }

}
