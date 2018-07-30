import { Component, OnInit, AfterViewInit, Output, EventEmitter, Injector } from '@angular/core';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { CategoryChatState } from '../../../shared-v2/models/category-chat-state';
import { Message } from '../../models/message';
import { MessageSender } from '../../models/message-enums';
import { ContentService } from '../../../shared-v2/services/content.service';

@Component({
  selector: 'document-search',
  templateUrl: './document-search.component.html',
  styleUrls: ['./document-search.component.css']
})
export class DocumentSearchComponent implements OnInit, AfterViewInit, IChatMessageComponent {

  public state: CategoryChatState;
  content: any[];

  pressedSearch: boolean = false

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

  constructor(private _injector: Injector, private _contentService: ContentService) { }

  ngOnInit() {
    this.state = this._injector.get('state');
  }

  ngAfterViewInit() {
    this.onViewUpdate.emit();
  }

  onSubmit(formValue: any) {
    console.log(formValue);
    this._contentService.getContent(formValue.documentSearchInput).subscribe(content => {
      this.content = content;
      if (!this.pressedSearch) {
        this.pressedSearch = true;
        this.onComplete.emit({ status: true });
      }
    });
  }
}

export class DocumentSearchMessage extends Message {
  constructor(state: CategoryChatState, messageDelayInMs: number = 1000) {

    super(DocumentSearchComponent, { state: state, sender: MessageSender.User }, messageDelayInMs);
  }
}