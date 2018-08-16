import { Component, AfterViewInit, Output, EventEmitter, Injector } from '@angular/core';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { Message } from '../../models/message';
import { MessageSender } from '../../models/message-enums';
import { ContentService } from '../../../shared-v2/services/content.service';

@Component({
  selector: 'document-search',
  templateUrl: './document-search.component.html',
  styleUrls: ['./document-search.component.css']
})
export class DocumentSearchComponent implements AfterViewInit, IChatMessageComponent {

  content: any[];

  pressedSearch: boolean = false

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

  constructor(private _injector: Injector, private _contentService: ContentService) { }

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
  constructor(messageDelayInMs: number = 1000) {

    super(DocumentSearchComponent, { sender: MessageSender.User }, messageDelayInMs);
  }
}