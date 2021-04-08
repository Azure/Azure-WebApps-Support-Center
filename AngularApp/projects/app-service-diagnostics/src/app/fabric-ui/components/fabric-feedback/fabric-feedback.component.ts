import { Component, AfterViewInit, ViewChild, TemplateRef, AfterContentInit, OnInit, OnDestroy } from '@angular/core';
import { DirectionalHint, ICheckProps, IPanelProps, PanelType } from 'office-ui-fabric-react';
import { TelemetryService, TelemetryEventNames, PIIUtilities, TelemetrySource } from 'diagnostic-data';
import { Globals } from '../../../globals';
import { ActivatedRoute } from '@angular/router';
import * as momentNs from 'moment';
import { Guid } from '../../../shared/utilities/guid';


@Component({
  selector: 'fabric-feedback',
  templateUrl: './fabric-feedback.component.html',
  styleUrls: ['./fabric-feedback.component.scss']
})
export class FabricFeedbackComponent implements AfterViewInit, OnInit, OnDestroy {
  type: PanelType = PanelType.custom;
  siteName: string = "";
  ratingEventProperties: any;
  feedbackPanelConfig: { defaultFeedbackText?: string, notResetOnDismissed?: boolean, detectorName?: string, url?: string } = {};
  feedbackText: string = "";
  panelWidth: string = "315px";
  feedbackIcons: { id: string, text: string }[] =
    [
      {
        id: "Sad",
        text: "dissatisfied "
      },
      {
        id: "EmojiNeutral",
        text: "ok"
      },
      {
        id: "Emoji2",
        text: "satisfied"
      }
    ];
  submitted: boolean = false;
  rating: number = 0;
  checked: boolean = false;
  submittedPanelTimer: any = null;
  checkLabel: string = "Microsoft can email you about your feedback";
  tooltipDirectionalHint = DirectionalHint.rightBottomEdge;

  submittedPanelStyles: IPanelProps["styles"] = {
    root: {
      height: "120px"
    }
  }
  currentTime: string = "";
  constructor(protected telemetryService: TelemetryService, public globals: Globals, private activatedRoute: ActivatedRoute) {
  }

  submitFeedback() {
    const eventProps = {
      Rating: String(this.rating),
      Feedback: PIIUtilities.removePII(this.feedbackText)
    };
    const detectorName = this.feedbackPanelConfig.detectorName || this.globals.getDetectorName();
    const isHomepage = !this.activatedRoute.root.firstChild.firstChild.firstChild.firstChild.snapshot.params["category"];
    this.ratingEventProperties = {
      'DetectorId': detectorName,
      'Url': window.location.href,
      'Location': isHomepage ? TelemetrySource.LandingPage : TelemetrySource.CategoryPage,
      'MayContact': this.checked,
      'FeedbackId': Guid.newShortGuid()
    };
    this.logEvent(TelemetryEventNames.StarRatingSubmitted, eventProps);

    this.reset();
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

  ngOnInit() {
    this.reset();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const eles = document.querySelectorAll("#feedback-icons i");
      if (eles && eles.length > 0) {
        eles.forEach((ele, index) => {
          ele.setAttribute("role", "button");
          ele.setAttribute("name", this.feedbackIcons[index].text);
        });
      }
    });
  }

  reset() {
    this.rating = 0;
    this.feedbackText = this.feedbackPanelConfig.defaultFeedbackText || "";
    this.checked = false;
    this.globals.openFeedback = false;
  }


  dismissedFeedbackHandler() {
    if (this.feedbackPanelConfig.notResetOnDismissed) {
      this.globals.openFeedback = false;
      return;
    }
    this.reset();
  }

  dismissedSubmittedHandler() {
    this.submitted = false;
  }

  onOpenSubmittedPanel() {
    this.currentTime = momentNs(Date.now()).format("hh:mm A");
    this.submittedPanelTimer = setTimeout(() => {
      this.dismissedSubmittedHandler();
    }, 3000);
  }

  onOpenFeedbackPanel() {
    if (this.feedbackPanelConfig.url != window.location.href.split("?")[0]) {
      var globals = this.globals;
      if (globals.messagesData.feedbackPanelConfig != null && globals.messagesData.feedbackPanelConfig.url == window.location.href.split("?")[0]) {
        this.feedbackPanelConfig = globals.messagesData.feedbackPanelConfig;

      } else {
        this.feedbackPanelConfig = {url: window.location.href.split("?")[0]};
      }
      this.feedbackText = this.feedbackPanelConfig.defaultFeedbackText || "";
    }
    this.siteName = this.activatedRoute.root.firstChild.firstChild.snapshot.params['resourcename'];
  }

  ngOnDestroy() {
    this.submittedPanelTimer = null;
  }
}
