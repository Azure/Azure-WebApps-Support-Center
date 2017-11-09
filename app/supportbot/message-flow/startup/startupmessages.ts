import { Injectable } from '@angular/core';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { TextMessage } from '../../models/message';
import { MessageGroup } from '../../models/message-group';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';

@Injectable()
@RegisterMessageFlowWithFactory()
export class StartupMessages implements IMessageFlowProvider {

    public GetMessageFlowList(): MessageGroup[] {

        var messageGroupList: MessageGroup[] = [];

        var welcomeMessageGroup: MessageGroup = new MessageGroup('startup', [], 'main-menu');
        welcomeMessageGroup.messages.push(new TextMessage('Hello! Welcome to App Service diagnostics! I’m here to help you diagnose and solve problems with your Web App.'));

        messageGroupList.push(welcomeMessageGroup);

        return messageGroupList;
    }
}