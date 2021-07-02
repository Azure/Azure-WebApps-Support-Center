
import { Inject } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { DiagnosticDataConfig, DIAGNOSTIC_DATA_CONFIG } from '../../config/diagnostic-data-config';
import { TelemetryService } from "../../services/telemetry/telemetry.service";

@Component({
  selector: 'solution-view-container',
  templateUrl: './solution-view-container.component.html',
  styleUrls: ['./solution-view-container.component.scss']
})
export class SolutionViewContainerComponent implements OnInit {
    @Input() solutionTitle: string = "";
    @Input() isRecommended: boolean = false;
    @Input() detector: string = "";
    @Input() isAnalysisView: boolean = false;
    @Input() isKeystoneDetector: boolean = false;

    solutionTitleImageSrc: string = "../../../../assets/img/case-submission-flow/Help-and-Support.svg";

    yesSelected: boolean;
    noSelected: boolean;
    showThanksMessage: boolean = false;
    eventProps: { [name: string]: string } = {};
    isPublic: boolean;


    constructor(protected telemetryService: TelemetryService, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
        this.isPublic = config && config.isPublic;
     }

    ngOnInit() {
        this.solutionTitleImageSrc = this.getIconImagePath();
        this.eventProps = {
            'Detector': this.detector,
            'IsKeystoneDetector': String(this.isKeystoneDetector),
            'SolutionTitle': this.solutionTitle,
            'IsRecommmended': String(this.isRecommended),
            'IsAnalysisView': String(this.isAnalysisView)
          };

        this.telemetryService.logEvent('SolutionLoaded', this.eventProps);
    }

    private getIconImagePath() {
         let publicImagePath = this.isRecommended ? "../../../../assets/img/case-submission-flow/Help-and-Support.svg" : "../../../../assets/img/case-submission-flow/Troubleshoot.svg";
         let internalImagePath = this.isRecommended ? "assets/img/Help-and-Support.svg" : "assets/img/Troubleshoot.svg";
         return this.isPublic ? publicImagePath : internalImagePath;
        }

    feedbackButtonClicked(helpful: boolean) {
        this.yesSelected = helpful;
        this.noSelected = !helpful;

        const feedbackEventProps = {
            ...this.eventProps,
            'IsHelpful': String(helpful)
        }

        this.telemetryService.logEvent("SolutionFeedback", feedbackEventProps);
        this.showThanksMessage = this.yesSelected || this.noSelected;
    }

}


