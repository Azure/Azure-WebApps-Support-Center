import { Component, OnInit, Input } from '@angular/core';
import { WindowService } from '../../../startup/services/window.service';
import { SiteService } from '../../services/site.service';
import { BotLoggingService } from '../../services/logging/bot.logging.service';
import { Site, SiteInfoMetaData } from '../../models/site';
import { ArmService } from '../../services/arm.service';

@Component({
    selector: 'liveagent-chat',
    template: ''
})
export class LiveAgentChatComponent implements OnInit {

    @Input() autoOpen: boolean = false;
    @Input() source: string = '';
    private restoreIdTagName: string;

    // As we dont have any Resource Service yet, Right now using Site as resource.
    // After refactoring, this has to come from a generic Resource service.
    private currentResource: Site;

    constructor(private windowService: WindowService, private siteService: SiteService, private armService: ArmService, private logger: BotLoggingService) {
    }

    ngOnInit(): void {

        let restoreId: string = '';
        let externalId: string = '';
        let window = this.windowService.window;

        this.siteService.currentSite.subscribe((site: Site) => {

            this.currentResource = site;
            this.restoreIdTagName = `hidden-related:${this.currentResource.id}/diagnostics/chatRestorationId`;
            externalId = site.id;

            restoreId = this.getChatRestoreId();

            if (window && window.fcWidget) {

                window.fcWidget.init({
                    token: "ac017aa7-7c07-42bc-8fdc-1114fc962803",
                    host: "https://wchat.freshchat.com",
                    open: this.autoOpen,
                    externalId: externalId,
                    restoreId: restoreId,
                    firstName: this.currentResource.name,
                    config: {
                        content: {
                            placeholders: {
                                reply_field: 'Describe your problem or reply here',
                            },
                            headers: {
                                channel_response: {
                                    offline: 'We are currently away. Please leave us a message',
                                    online: 
                                    {
                                            minutes: {
                                              one: "Online",
                                              more: "Online"
                                            },
                                            hours: {
                                              one: "Online",
                                              more: "Online",
                                            }
                                    }
                                  }
                            }
                        }
                    }
                });

                window.fcWidget.on("widget:loaded", ((resp) => {
                    this.getOrCreateUser();
                }));

                window.fcWidget.on("widget:opened", (() => {
                    this.logger.LogLiveChatWidgetOpened(this.source);
                }));

                window.fcWidget.on("widget:closed", (() => {
                    this.logger.LogLiveChatWidgetClosed(this.source);
                }));
            }
        });
    }

    private getOrCreateUser() {

        let window = this.windowService.window;

        if (window.fcWidget) {

            window.fcWidget.user.get().then((result: any) => {
                this.updateChatRestoreId(result.data.restoreId);
            }, (err: any) => {
                // User doesnt exist. Create the user and update the RestoreId.
                window.fcWidget.user.create().then((createResponse: any) => {
                    this.updateChatRestoreId(createResponse.data.restoreId);
                }, (err1: any) => {
                });
            });
        }
    }

    private updateChatRestoreId(restoreId: string) {

        // if restoreId is already present, dont update it again
        if (this.getChatRestoreId() === restoreId) {
            return;
        }

        this.currentResource.tags[this.restoreIdTagName] = restoreId;

        let body: any = {
            tags: this.currentResource.tags
        };

        // Limitation : If for the first time, resource was opened by RBAC role which doesn't have access to patch the resource,
        // then the current chat session will not be restored next-time. 
        // TODO : We might need to store this restoreId somewhere else globally.
        this.armService.patchResource(this.currentResource.id, body).subscribe((data: any) => { });
    }

    private getChatRestoreId(): string {

        if (this.currentResource && this.currentResource.tags && this.currentResource.tags[this.restoreIdTagName]) {
            return this.currentResource.tags[this.restoreIdTagName];
        }

        return '';
    }
}
