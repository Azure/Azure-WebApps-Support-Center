import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'timespan',
  templateUrl: './timespan.component.html',
  styleUrls: ['./timespan.component.css']
})
export class TimespanComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    if (this.TimeSpan && this.TimeSpan !== ''){
      this.Seconds = this.timeToSeconds(this.TimeSpan);
    }    
  }

  @Input() TimeSpan: string;
  @Input() placeholder:string;
  @Output() TimeSpanChange = new EventEmitter<string>();
  Seconds:number;

  updateTimeSpan(val){
      this.Seconds = val;
      let timeSpan = this.secondsToTime(this.Seconds);
      this.TimeSpanChange.emit(timeSpan);      
  }

  timeToSeconds(timeInterval: string): number {
    if (timeInterval.indexOf(':') < 0) {
      return 0;
    }
    var a = timeInterval.split(':'); // split it at the colons
    // minutes are worth 60 seconds. Hours are worth 60 minutes.    
    var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
    return seconds;
  }

  secondsToTime(seconds: number): string {
    var date = new Date(null);
    date.setSeconds(seconds); // specify value for SECONDS here
    var timeString = date.toISOString().substr(11, 8);
    return timeString;
  }
}
