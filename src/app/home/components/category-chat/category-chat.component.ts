import { Component, OnInit, Injector } from '@angular/core';
import { MessageProcessor } from '../../../supportbot/message-processor.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'category-chat',
  templateUrl: './category-chat.component.html',
  styleUrls: ['./category-chat.component.css']
})
export class CategoryChatComponent implements OnInit {

  messageProcessor: MessageProcessor;

  category: string;

  constructor(private _injector: Injector, private _activatedRoute: ActivatedRoute) { 

    this.category = this._activatedRoute.snapshot.params.category;

    this.messageProcessor = new MessageProcessor(_injector);
    this.messageProcessor.setCurrentKey(`welcome-${this.category}`);
  }

  ngOnInit() {

  }

}
