import { Component } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { Globals } from '../../../globals';

@Component({
  selector: 'fabric-feedback',
  templateUrl: './fabric-feedback.component.html',
  styleUrls: ['./fabric-feedback.component.scss']
})
export class FabricFeedbackComponent {
  type: PanelType = PanelType.custom;
  // dismissSubject: Subject<void> = new Subject<void>();
  ratingEventProperties: any;
  feedbackText: string = "";
  feedbackIcons: string[] = ["EmojiDisappointed", "Sad", "EmojiNeutral", "Emoji2", "Emoji"];
  submitted: boolean = false;
  rating: number = 0;

  constructor(protected telemetryService: TelemetryService, public globals: Globals) {
    // this.submitted = false;
  }

  submitFeedback() {
    const eventProps = {
      Rating: String(this.rating),
      Feedback: this.feedbackText
    };
    const detectorName = this.globals.getDetectorName();
    this.ratingEventProperties = {
      'DetectorId': detectorName,
      'Url': window.location.href,
      'Version':'V4'
    };
    this.logEvent(TelemetryEventNames.StarRatingSubmitted, eventProps);
    this.submitted = true;
  }

  setRating(index: number) {
    this.rating = index + 1;
  }

  protected logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
    for (const id of Object.keys(this.ratingEventProperties)) {
      if (this.ratingEventProperties.hasOwnProperty(id)) {
        eventProperties[id] = String(this.ratingEventProperties[id]);
      }
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }

  openGenieHandler() {
    this.globals.openFeedback = false;
    this.globals.openGeniePanel = true;
  }

  ngOnInit() {
    this.reset();
  }

  reset() {
    this.rating = 0;
    this.feedbackText = "";
    this.submitted = false;
  }


  dismissedHandler() {
    this.globals.openFeedback = false;
    this.reset();
  }
}
