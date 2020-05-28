import { Component, ViewChild, ElementRef, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { Globals } from '../../../globals';
import { FabIconComponent } from '@angular-react/fabric';

@Component({
  selector: 'fabric-feedback',
  templateUrl: './fabric-feedback.component.html',
  styleUrls: ['./fabric-feedback.component.scss']
})
export class FabricFeedbackComponent implements AfterViewInit{
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
  // @ViewChild("fabIcons",{static:false}) fabIcons:ElementRef;
  @ViewChildren('fabIcons') fabIcons:QueryList<FabIconComponent>
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
      'Url': window.location.href
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
    const fabList = this.fabIcons.toArray();
    const feedbackIcons = [...this.feedbackIcons];
    //Need async to get the child <i> under <fab-icon> element
    setTimeout(function(){
      //Get all <i> tags to modify role and name attributes;
      const nativeEles = fabList.map(ele => <HTMLElement>ele.elementRef.nativeElement.firstChild);
      nativeEles.forEach((ele,index) => {
        ele.setAttribute("role","button");
        ele.setAttribute("name",feedbackIcons[index].text);
      });
    },100);
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
