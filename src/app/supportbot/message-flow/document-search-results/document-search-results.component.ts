import { Component, OnInit, EventEmitter, Output, Injector, AfterViewInit } from '@angular/core';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { CategoryChatState } from '../../../shared-v2/models/category-chat-state';
import { Message } from '../../models/message';
import { ContentService } from '../../../shared-v2/services/content.service';

@Component({
  selector: 'document-search-results',
  templateUrl: './document-search-results.component.html',
  styleUrls: ['./document-search-results.component.css']
})
export class DocumentSearchResultsComponent implements OnInit, AfterViewInit, IChatMessageComponent {

  public state: CategoryChatState;

  content: any[];

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();
  
  constructor(private _injector: Injector, private _contentService: ContentService) { }

  ngOnInit() {
    this.state = this._injector.get('state');

    this._contentService.getContent().subscribe(content => {
      this.content = content;
      this.onComplete.emit({status: true});
    });
  }

  ngAfterViewInit() {
    this.onViewUpdate.emit();
  }

  openArticle(link) {
    window.open(link, '_blank');
  }

}

export class DocumentSearchResultsMessage extends Message {
  constructor(state: CategoryChatState, messageDelayInMs: number = 1000) {

    super(DocumentSearchResultsComponent, { state: state }, messageDelayInMs);
  }
}