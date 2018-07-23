import { Injectable } from '@angular/core';
import { OperatingSystem, Site, SiteExtensions, SiteInfoMetaData } from '../models/site';
import { operators, BehaviorSubject } from 'rxjs';
import { ToolNames } from '../models/tools-constants';
import { ResourceType, AppType, StartupInfo } from '../models/portal';
import { Observable } from 'rxjs/Observable';
import { DemoSubscriptions } from '../../betaSubscriptions';
import { LiveChatSettings } from '../../liveChatSettings';
import { AuthService } from './auth.service';
import { SiteService } from './site.service';
import { WindowService } from './window.service';
import { BotLoggingService } from './logging/bot.logging.service';
import { ArmService } from './arm.service';
import * as moment from 'moment-timezone';
import { Sku } from '../models/server-farm';

@Injectable()
export class LiveChatService {

    // As we dont have any Resource Service yet, Right now using Site as resource.
    // After refactoring, this has to come from a generic Resource service.
    private currentResource: Site;

    private restoreIdTagName: string;

    constructor(private windowService: WindowService, private authService: AuthService, private siteService: SiteService, private armService: ArmService, private logger: BotLoggingService) {

        let window = this.windowService.window;

        this.authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {

            if (this.isChatApplicableForSupportTopic(startupInfo)) {

                setTimeout(() => {

                    this.startChat(false, '', LiveChatSettings.DemoModeForCaseSubmission, 'ltr');

                }, LiveChatSettings.InactivityTimeoutInMs);


                window.fcWidget.on("widget:loaded", ((resp) => {

                    if (window.fcWidget.isOpen() != true) {
                        setTimeout(() => {
                            // Raise an event for trigger message campaign
                            window.fcWidget.track('supportCaseSubmission', {
                                supportTopicId: startupInfo.supportTopicId
                            });

                        }, 1000);
                    }

                }));
            }
        });
    }

    public startChat(autoOpen: boolean, source: string, demoMode: boolean = false, chatPosition: string = '') {

        let restoreId: string = '';
        let externalId: string = '';
        let window = this.windowService.window;

        this.siteService.currentSite.subscribe((site: Site) => {

            if (site) {
                this.siteService.currentSiteMetaData.subscribe((siteMetaData: SiteInfoMetaData) => {

                    if (siteMetaData) {

                        if (this.isChatApplicableForSite(site, siteMetaData, demoMode)) {

                            this.currentResource = site;
                            this.restoreIdTagName = `hidden-related:${this.currentResource.id}/diagnostics/chatRestorationId`;
                            externalId = site.id;

                            restoreId = this.getChatRestoreId();

                            if (window && window.fcWidget) {

                                window.fcWidget.init({
                                    token: "ac017aa7-7c07-42bc-8fdc-1114fc962803",
                                    host: "https://wchat.freshchat.com",
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
                                    this.logger.LogLiveChatWidgetOpened(source);
                                }));

                                window.fcWidget.on("widget:closed", (() => {
                                    this.logger.LogLiveChatWidgetClosed(source);
                                }));
                            }
                        }
                    }
                });
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

    // This method indicate whether chat is applicable for current site
    private isChatApplicableForSite(site: Site, siteMetaData: SiteInfoMetaData, demoMode: boolean): boolean {

        return site && siteMetaData
            && !(site.sku.toLowerCase() === 'free' || site.sku.toLowerCase() === 'shared')
            && (site.appType == AppType.WebApp)
            && (SiteExtensions.operatingSystem(site) == OperatingSystem.windows)
            && (!demoMode || (DemoSubscriptions.betaSubscriptions.indexOf(siteMetaData.subscriptionId) >= 0));
    }

    // This method indicate whether chat is applicable for support toic or not
    private isChatApplicableForSupportTopic(startupInfo: StartupInfo): boolean {

        var isApplicable: boolean = startupInfo
            && startupInfo.workflowId && startupInfo.workflowId !== ''
            && startupInfo.supportTopicId && startupInfo.supportTopicId !== '' && (LiveChatSettings.enabledSupportTopics.indexOf(startupInfo.supportTopicId) >= 0);

        var currentDateTime: moment.Moment = moment.tz('America/Los_Angeles');

        isApplicable = isApplicable
            && (currentDateTime.day() >= LiveChatSettings.BuisnessStartDay && currentDateTime.day() <= LiveChatSettings.BuisnessEndDay)
            && (currentDateTime.hour() >= LiveChatSettings.BusinessStartHourPST && currentDateTime.hour() < LiveChatSettings.BusinessEndHourPST);

        return isApplicable;
    }
}