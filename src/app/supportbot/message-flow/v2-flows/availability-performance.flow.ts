import { Injectable } from '@angular/core';
import { MessageGroup } from '../../models/message-group';
import { TextMessage, ButtonListMessage } from '../../models/message';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { MessageSender, ButtonActionType } from '../../models/message-enums';
import { CategoryMenuMessage } from '../category-menu/category-menu.component';
import { HealthCheckMessage } from '../health-check/healthcheckmessageflow';

@Injectable()
@RegisterMessageFlowWithFactory()
export class AvailabilityPerformanceFlow extends IMessageFlowProvider {

    GetMessageFlowList(): MessageGroup[] {

        let messageGroupList: MessageGroup[] = [];

        var availailabilityPerformance: MessageGroup = new MessageGroup('welcome-AvailabilityAndPerformance', [], () => 'feedbackprompt');
        availailabilityPerformance.messages.push(new TextMessage('Hello! Welcome to App Service diagnostics! My name is Genie and I\'m here to help you diagnose and solve problems.', MessageSender.System));
        availailabilityPerformance.messages.push(new TextMessage('Let me run a health check for you so you can get a quick view of the health of your app', MessageSender.System));
        availailabilityPerformance.messages.push(new HealthCheckMessage());
        availailabilityPerformance.messages.push(new TextMessage('If you are facing a specific issue, please choose the tile below that best describes the problem you are facing.', MessageSender.System, 2000));
        availailabilityPerformance.messages.push(new CategoryMenuMessage(true));

        var categoryMainMenu: MessageGroup = new MessageGroup('availability-menu', [], () => 'feedback');
        categoryMainMenu.messages.push(new CategoryMenuMessage());
        categoryMainMenu.messages.push(new TextMessage('Did you find what you were looking for?', MessageSender.System, 3000));
        categoryMainMenu.messages.push(new ButtonListMessage(this._getButtonListDidYouFindHelpful('in-chat-search'), 'Did you find what you were looking for?'));
        categoryMainMenu.messages.push(new TextMessage('Yes I found the right information.', MessageSender.User));
        categoryMainMenu.messages.push(new TextMessage('Great I\'m glad I could be of help!', MessageSender.System));

        messageGroupList.push(categoryMainMenu);
        messageGroupList.push(availailabilityPerformance);
        return messageGroupList;
    }

    private _getButtonListDidYouFindHelpful(furtherAssistance: string): any {
        return [{
          title: 'Yes I found the right information',
          type: ButtonActionType.Continue,
          next_key: ''
        }, {
          title: 'I need further assistance',
          type: ButtonActionType.SwitchToOtherMessageGroup,
          next_key: furtherAssistance
        }];
      }
}