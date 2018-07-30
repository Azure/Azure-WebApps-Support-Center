import { Component, OnInit, AfterViewInit, Output, EventEmitter, Injector } from '@angular/core';
import { IChatMessageComponent } from '../../../supportbot/interfaces/ichatmessagecomponent';
import { DetectorMetaData } from '../../../../../node_modules/applens-diagnostics/src/app/diagnostic-data/models/detector';
import { Message, TextMessage } from '../../../supportbot/models/message';
import { CategoryChatState } from '../../../shared-v2/models/category-chat-state';
import { DiagnosticService } from '../../../../../node_modules/applens-diagnostics';
import { MessageSender } from '../../models/message-enums';

@Component({
  selector: 'category-menu',
  templateUrl: './category-menu.component.html',
  styleUrls: ['./category-menu.component.css']
})
export class CategoryMenuComponent implements OnInit, AfterViewInit, IChatMessageComponent {

  detectors: DetectorMetaData[];
  state: CategoryChatState;

  selectedDetector: DetectorMetaData;

  message: TextMessage;

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

  constructor(private _injector: Injector, private _diagnosticService: DiagnosticService) { }

  ngOnInit() {
    this.detectors = this._injector.get('detectors');
    this.state = this._injector.get('state');
    this.detectors.forEach(detector => {
      // Make request for each detector
      this._diagnosticService.getDetector(detector.id).subscribe();
    });
  }

  ngAfterViewInit() {
    this.onViewUpdate.emit();
  }

  select(detector: DetectorMetaData) {
    this.state.makeMenuSelection(detector);
    this.message = new TextMessage(`I am interested in ${detector.name}`, MessageSender.User);
    this.selectedDetector = detector;
    this.onComplete.emit({ status: true, data: {} });
  }

}

export class CategoryMenuMessage extends Message {
  constructor(detectors: DetectorMetaData[], state: CategoryChatState, messageDelayInMs: number = 1000) {

    super(CategoryMenuComponent, { detectors: detectors, state: state }, messageDelayInMs);
  }
}