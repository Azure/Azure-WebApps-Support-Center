import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';

@Component({
  selector: 'star-rating',
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
})

export class StarRatingComponent {
  constructor(protected telemetryService: TelemetryService) {
  }

  ngOnInit() {
  }

  @Input() isModal: boolean;
  @Input() ratingEventProperties: any;
  @Output() submit: EventEmitter<boolean> = new EventEmitter<boolean>();

  showThanksMessage: boolean = false;
  rating: number = 0;
  comments: string = "Start your rating.";
  feedbackText: string;


  hideWholeForm: boolean;

  setStar(data: any, comments?: any) {
    this.rating = data;
    this.comments = comments;
  }

  public feedbackMessageSubmitted() {
    var eventProps = {
      Rating: String(this.rating),
      Feedback: this.feedbackText
    };

    this.logEvent(TelemetryEventNames.StarRatingSubmitted, eventProps);
    this.showThanksMessage = true;
    this.submit.emit(this.showThanksMessage);
  }

  protected logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
    for (let id in this.ratingEventProperties) {
      eventProperties[id] = String(this.ratingEventProperties[id]);
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }
  
}
