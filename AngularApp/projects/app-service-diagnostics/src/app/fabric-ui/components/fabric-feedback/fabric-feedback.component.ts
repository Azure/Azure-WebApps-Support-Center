import { Component, AfterViewInit } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { TelemetryService, TelemetryEventNames, PIIUtilities, TelemetryLocation } from 'diagnostic-data';
import { Globals } from '../../../globals';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'fabric-feedback',
  templateUrl: './fabric-feedback.component.html',
  styleUrls: ['./fabric-feedback.component.scss']
})
export class FabricFeedbackComponent implements AfterViewInit {
  type: PanelType = PanelType.custom;
  // dismissSubject: Subject<void> = new Subject<void>();
  ratingEventProperties: any;
  feedbackText: string = "";
  feedbackIcons: {id:string,text:string}[] = 
  [
      {
        id:"EmojiDisappointed",
        text:"very dissatisfied"
      }, 
      {
        id:"Sad",
        text:"dissatisfied "
      },
      {
        id:"EmojiNeutral",
        text:"ok"
      },
      {
        id:"Emoji2",
        text:"satisfied"
      },
      {
        id:"Emoji",
        text:"very satisfied"
      }
  ];
  submitted: boolean = false;
  rating: number = 0;
  constructor(protected telemetryService: TelemetryService, public globals: Globals,private activatedRoute:ActivatedRoute) {
    // this.submitted = false;
  }

  submitFeedback() {
    const eventProps = {
      Rating: String(this.rating),
      Feedback: PIIUtilities.removePII(this.feedbackText)
    };
    const detectorName = this.globals.getDetectorName();
    const isHomepage = !this.activatedRoute.root.firstChild.firstChild.firstChild.firstChild.snapshot.params["category"];
    this.ratingEventProperties = {
      'DetectorId': detectorName,
      'Url': window.location.href,
      'Location': isHomepage ? TelemetryLocation.LandingPage : TelemetryLocation.CategoryPage
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

  ngAfterViewInit() {
    setTimeout(() => {
      const eles = document.querySelectorAll("#feedback-icons i");
      if(eles && eles.length > 0) {
        eles.forEach((ele,index) => {
          ele.setAttribute("role","button");
          ele.setAttribute("name",this.feedbackIcons[index].text);
        });
      }
    });
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
