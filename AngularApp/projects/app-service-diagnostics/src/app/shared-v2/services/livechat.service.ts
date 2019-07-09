import { Injectable } from '@angular/core';
import { DemoSubscriptions } from '../../betaSubscriptions';
import { LiveChatSettings, ChatStatus } from '../../liveChatSettings';
import { AuthService } from '../../startup/services/auth.service';
import { WindowService } from '../../startup/services/window.service';
import { BotLoggingService } from '../../shared/services/logging/bot.logging.service';
import { ArmService } from '../../shared/services/arm.service';
import { ResourceService } from './resource.service';
import { ArmResource } from '../models/arm';
import { StartupInfo } from '../../shared/models/portal';
import { BackendCtrlService } from '../../shared/services/backend-ctrl.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable()
export class LiveChatService {

    private currentResource: ArmResource;

    private restoreIdTagName: string;

    private chatStatus: ChatStatus;

    constructor(private windowService: WindowService, private authService: AuthService, private _resourceService: ResourceService, private armService: ArmService,
        private logger: BotLoggingService, private _backendApi: BackendCtrlService) {

        const window = this.windowService.window;

        this.authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
            this._resourceService.warmUpCallFinished.subscribe((resourceLoaded: boolean) => {
                if (resourceLoaded) {
                    if (startupInfo.supportTopicId && startupInfo.supportTopicId != '') {
                        this._backendApi.get<ChatStatus>(`api/chat/${this._resourceService.azureServiceName}/${startupInfo.supportTopicId}/status`).subscribe((status: ChatStatus) => {
                            this.chatStatus = status;
                            if (this.isChatApplicable(startupInfo, this._resourceService.azureServiceName)) {

                                setTimeout(() => {

                                    this.startChat(status.freshToken, false, '', LiveChatSettings.DemoModeForCaseSubmission, 'ltr');

                                }, LiveChatSettings.InactivityTimeoutInMs);

                                window.fcWidget.on('widget:loaded', ((resp) => {

                                    if (window.fcWidget.isOpen() != true) {
                                        setTimeout(() => {
                                            // Raise an event for trigger message campaign
                                            window.fcWidget.track('supportCaseSubmission', {
                                                supportTopicId: startupInfo.supportTopicId,
                                                product: this._resourceService.azureServiceName
                                            });

                                        }, 1000);
                                    }

                                }));
                            }
                        });
                    }
                }

            });
        });
    }

    public startChat(freshToken: string, autoOpen: boolean, source: string, demoMode: boolean = false, chatPosition: string = '') {

        let restoreId: string = '';
        let externalId: string = '';
        const window = this.windowService.window;


        if (this.isChatApplicableForResource(demoMode)) {

            this.currentResource = this._resourceService.resource;
            this.restoreIdTagName = `hidden-related:${this.currentResource.id}/diagnostics/chatRestorationId`;
            externalId = this.currentResource.id;

            restoreId = this.getChatRestoreId();

            if (window && window.fcWidget) {

                this.logger.LogLiveChatWidgetBeginInit(source);

                window.fcWidget.init({
                    token: freshToken,
                    host: 'https://wchat.freshchat.com',
                    open: autoOpen,
                    externalId: externalId,
                    restoreId: restoreId,
                    firstName: this.currentResource.name,
                    config: {
                        headerProperty: {
                            direction: chatPosition
                        },
                        content: {
                            placeholders: {
                                reply_field: 'Describe your problem or reply here',
                            },
                            headers: {
                                csat_question: "Finished chatting? We'd love your feedback",
                                channel_response: {
                                    offline: 'We are currently away. Please leave us a message',
                                    online:
                                    {
                                        minutes: {
                                            one: 'Online',
                                            more: 'Online'
                                        },
                                        hours: {
                                            one: 'Online',
                                            more: 'Online',
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                window.fcWidget.on('widget:loaded', ((resp) => {
                    this.logger.LogLiveChatWidgetLoaded(source);
                    this.getOrCreateUser();
                }));

                window.fcWidget.on('widget:opened', (() => {
                    this.logger.LogLiveChatWidgetOpened(source);
                }));

                window.fcWidget.on('widget:closed', (() => {
                    this.logger.LogLiveChatWidgetClosed(source);
                }));
            }

        }
    }

    private getOrCreateUser() {

        const window = this.windowService.window;

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

        const body: any = {
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

    // This method indicate whether chat is applicable for current site
    public isChatApplicableForResource(demoMode: boolean): boolean {

        if (LiveChatSettings.HideForInternalSubscriptions == true && (DemoSubscriptions.betaSubscriptions.indexOf(this._resourceService.subscriptionId) >= 0)) {
            return false;
        }

        return LiveChatSettings.GLOBAL_ON_SWITCH
            && this._resourceService.isApplicableForLiveChat
            && (!demoMode || (DemoSubscriptions.betaSubscriptions.indexOf(this._resourceService.subscriptionId) >= 0));
    }

    // This method indicate whether chat is applicable or not
    private isChatApplicable(startupInfo: StartupInfo, azureServiceName: string): boolean {


        let isApplicable: boolean = startupInfo
            && startupInfo.workflowId && startupInfo.workflowId !== ''
            && startupInfo.supportTopicId && startupInfo.supportTopicId !== '';

        isApplicable = isApplicable && this.chatStatus.isEnabled && this.chatStatus.isValidTime;

        return LiveChatSettings.GLOBAL_ON_SWITCH && isApplicable;
    }
}
