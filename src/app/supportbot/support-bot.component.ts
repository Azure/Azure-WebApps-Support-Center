import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Message } from './models/message';
import { MessageProcessor } from './message-processor.service';

@Component({
    selector: 'support-bot',
    templateUrl: 'support-bot.component.html',
    providers: [MessageProcessor]
})
export class SupportBotComponent implements OnInit {
    @ViewChild('scrollMe') myScrollContainer: ElementRef;

    messages: Message[];
    showTypingMessage: boolean;
    chatContainerHeight: number;

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;
    hostingEnvironmentName: string;

    @Input() startingKey: string;

    constructor(private _messageProcessor: MessageProcessor) {
        this.messages = [];
        this.showTypingMessage = false;
        this.chatContainerHeight = 0;
    }

    ngOnInit(): void {
        if(this.startingKey) {
            this._messageProcessor.setCurrentKey(this.startingKey);
        }

        this.chatContainerHeight = window.innerHeight - 60;

        this.getMessage();
    }

    scrollToBottom(event?: any): void {

        try {
            this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }

    getMessage(event?: any): void {
        let self = this;
        let message = this._messageProcessor.getNextMessage(event);

        if (message) {

            if (message.messageDelayInMs >= 2000) {
                this.showTypingMessage = true;

                // To show the typing message icon, we need to scroll the page to the bottom.
                setTimeout(() => {
                    this.scrollToBottom();
                }, 200);
            }

            setTimeout(function () {
                self.showTypingMessage = false;
                self.messages.push(message);
            }, message.messageDelayInMs);
        }
    }
}