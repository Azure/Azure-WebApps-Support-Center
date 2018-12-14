import { Component, Injector, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { MessageSender } from '../../models/message-enums';

@Component({
    templateUrl: 'text-message.component.html'
})
export class TextMessageComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    message: string = '';
    messageByUser: boolean = false;

    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

    constructor(private injector: Injector) {
    }

    ngOnInit(): void {
        this.message = this.injector.get('message');
        const sender = this.injector.get('sender');
        if (sender === MessageSender.User) {
            this.messageByUser = true;
        }
    }

    ngAfterViewInit(): void {
        this.onViewUpdate.emit();

        this.onComplete.emit({
            status: true
        });
    }
}
