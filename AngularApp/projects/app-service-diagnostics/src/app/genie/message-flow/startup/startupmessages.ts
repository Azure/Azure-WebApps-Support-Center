import { Injectable } from '@angular/core';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { TextMessage } from '../../models/message';
import { MessageGroup } from '../../models/message-group';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';

@Injectable()
@RegisterMessageFlowWithFactory()
export class StartupMessages extends IMessageFlowProvider {

    public GetMessageFlowList(): MessageGroup[] {

        const messageGroupList: MessageGroup[] = [];

        const welcomeMessageGroup: MessageGroup = new MessageGroup('startup', [], () => '');
     
        messageGroupList.push(welcomeMessageGroup);

        return messageGroupList;
    }


}
