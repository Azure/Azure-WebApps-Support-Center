import { Injectable } from '@angular/core';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { Message, TextMessage, ButtonActionType, ButtonListMessage, MessageSender} from '../../models/message';
import { MessageGroup } from '../../models/message-group';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { SolutionsMessage } from '../../common/solutions-message/solutions-message.component';
import { GraphMessage } from '../../common/graph-message/graph-message.component';
import { ProblemStatementMessage } from '../../common/problem-statement-message/problem-statement-message.component';


@Injectable()
@RegisterMessageFlowWithFactory()
export class CpuAnalysisChatFlow implements IMessageFlowProvider {
    GetMessageFlowList(): MessageGroup[] {
        var messageGroupList: MessageGroup[] = [];

        var cpuAnalysisGroup: MessageGroup = new MessageGroup('cpuanalysis', [], 'feedbackprompt');
        cpuAnalysisGroup.messages.push(new TextMessage('I noticed that your app was experiencing high CPU usage within the last 24 hours. Would you like me to show you more details about the issues we found?'));
        cpuAnalysisGroup.messages.push(new ButtonListMessage(this._getButtonListForHealthCheck(), 'Show CPU Analysis'));
        cpuAnalysisGroup.messages.push(new TextMessage('Yes I want to see CPU issues', MessageSender.User, 0));
        cpuAnalysisGroup.messages.push(new ProblemStatementMessage(2000));        
        cpuAnalysisGroup.messages.push(new TextMessage('Below is your CPU Usage for the last 24 hours. The first graph shows the overall CPU usage on each instance. The second graph shows the CPU usage breakdown per app, according to the specific instance selected in the dropdown.', MessageSender.System, 2000));
        cpuAnalysisGroup.messages.push(new GraphMessage(0));
        cpuAnalysisGroup.messages.push(new TextMessage('Would you like to see the troubleshooting suggestions that I have tailored to your specific issue?', MessageSender.System, 3000));
        cpuAnalysisGroup.messages.push(new ButtonListMessage(this._getButtonListForSolutionPrompt(), 'Show CPU solutions'));
        cpuAnalysisGroup.messages.push(new TextMessage('Yes!', MessageSender.User, 0));        
        cpuAnalysisGroup.messages.push(new SolutionsMessage(2000));

        messageGroupList.push(cpuAnalysisGroup);

        var noCpuAnalysisGroup: MessageGroup = new MessageGroup('nocpuanalysis', [], 'feedbackprompt');
        noCpuAnalysisGroup.messages.push(new TextMessage('No problem. You can still access all the data by going to \'High CPU\' above'));

        messageGroupList.push(noCpuAnalysisGroup);

        return messageGroupList;
    }

    private _getButtonListForHealthCheck(): any {
        return [{
            title: 'Yes I want to see CPU issues',
            type: ButtonActionType.Continue,
            next_key: ''
        }, {
            title: 'No Thanks',
            type: ButtonActionType.SwitchToOtherMessageGroup,
            next_key: ''
        }];
    }

    private _getButtonListForSolutionPrompt(): any {
        return [{
            title: 'Yes I would like to see the troubleshooting options',
            type: ButtonActionType.Continue,
            next_key: ''
        }, {
            title: 'No Thanks',
            type: ButtonActionType.SwitchToOtherMessageGroup,
            next_key: ''
        }];
    }
}
