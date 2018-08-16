import { Component, OnInit, AfterViewInit, Output, EventEmitter, Injector } from '@angular/core';
import { IChatMessageComponent } from '../../../supportbot/interfaces/ichatmessagecomponent';
import { DetectorMetaData } from 'applens-diagnostics';
import { Message, TextMessage } from '../../../supportbot/models/message';
import { DiagnosticService } from 'applens-diagnostics';
import { MessageSender } from '../../models/message-enums';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { Feature } from '../../../shared-v2/models/features';

@Component({
  selector: 'category-menu',
  templateUrl: './category-menu.component.html',
  styleUrls: ['./category-menu.component.css']
})
export class CategoryMenuComponent implements OnInit, AfterViewInit, IChatMessageComponent {

  takeFeatureAction: boolean;
  features: Feature[];
  featureSelected: boolean = false;
  message: TextMessage;

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

  constructor(private _injector: Injector, private _diagnosticService: DiagnosticService, private _featureService: FeatureService, private _chatState: CategoryChatStateService) { }

  ngOnInit() {
    this.takeFeatureAction = this._injector.get('takeFeatureAction');
    this.features = this._featureService.getFeaturesForCategory(this._chatState.category);
    
    if (!this.takeFeatureAction) {
      this.features.forEach(detector => {
        // Make request for each detector
        this._diagnosticService.getDetector(detector.id).subscribe();
      });
    }
  }

  ngAfterViewInit() {
    this.onViewUpdate.emit();
  }

  select(detector: Feature) {
    if (this.takeFeatureAction) {
      detector.clickAction();
    }
    else {
      this._chatState.selectedFeature = detector;
      this.message = new TextMessage(`I am interested in ${detector.name}`, MessageSender.User);
      this.featureSelected = true;
    }

    this.onComplete.emit({ status: true, data: {} });
  }

}

export class CategoryMenuMessage extends Message {
  constructor(takeFeatureAction: boolean = false, messageDelayInMs: number = 1000) {
    super(CategoryMenuComponent, { takeFeatureAction: takeFeatureAction }, messageDelayInMs);
  }
}