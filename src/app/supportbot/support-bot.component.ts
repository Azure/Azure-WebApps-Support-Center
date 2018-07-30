import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { IAppAnalysisResponse } from '../shared/models/appanalysisresponse';
import { Observable } from 'rxjs/Observable';
import { Message } from './models/message';
import { MessageProcessor } from './message-processor.service';
import { AppAnalysisService } from '../shared/services/appanalysis.service';
import { WindowService } from '../startup/services/window.service';

@Component({
    selector: 'support-bot',
    templateUrl: 'support-bot.component.html'
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

    @Input() overrideMessageProcessor: MessageProcessor;

    constructor(private _messageProcessor: MessageProcessor) {
        this.messages = [];
        this.showTypingMessage = false;
        this.chatContainerHeight = 0;
    }

    ngOnInit(): void {
        if(this.overrideMessageProcessor) {
            this._messageProcessor = this.overrideMessageProcessor;
        }

        // this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        // this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        // this.siteName = this._route.snapshot.params['sitename'];
        // this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';
        // this.hostingEnvironmentName = this._route.snapshot.params['name'];
        this.chatContainerHeight = window.innerHeight - 60;

        this.getMessage();

        // let warmupTasks = Observable.forkJoin(this._getWarmpUpTasks());
        // warmupTasks.subscribe(data => {
        // });
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

    // private _getWarmpUpTasks(): Observable<IAppAnalysisResponse>[] {

    //     var analysisList = ["appanalysis", "perfanalysis"]
    //     var result: Observable<IAppAnalysisResponse>[] = [];
    //     if(this.siteName && this.siteName != '') {
    //         analysisList.forEach((item) => {
    //             result.push(this._analysisService.getAnalysisResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', item));
    //         });
    //     }

    //     return result;
    // }
}