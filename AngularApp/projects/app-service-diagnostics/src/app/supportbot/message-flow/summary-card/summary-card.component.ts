import { Component, OnInit, Input } from '@angular/core';
import { HealthStatus } from 'diagnostic-data';


@Component({
  selector: 'summary-card',
  templateUrl: './summary-card.component.html',
  styleUrls: ['./summary-card.component.scss']
})
export class SummaryCardComponent implements OnInit {
  @Input() summary:Summary;
  SummaryStatus = HealthStatus;

  constructor() { }
  ngOnInit() {
  }

}

export class Summary {
  status: HealthStatus;
  title:string;
  message:string;
  description:string;
  
  constructor(status:HealthStatus,title:string,message:string,description:string) {
    this.status = status;
    this.title = title;
    this.message = message;
    this.description = description;
  }
}
