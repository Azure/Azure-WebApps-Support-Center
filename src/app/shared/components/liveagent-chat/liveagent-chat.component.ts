import { Component, OnInit, Input } from '@angular/core';
import { LiveChatService } from '../../../shared-v2/services/livechat.service';

@Component({
    selector: 'liveagent-chat',
    template: ''
})
export class LiveAgentChatComponent implements OnInit {

    @Input() autoOpen: boolean = false;
    @Input() source: string = '';

    constructor(private liveChatService: LiveChatService) {
    }

    ngOnInit(): void {
        this.liveChatService.startChat(this.autoOpen, this.source);
    }
}
