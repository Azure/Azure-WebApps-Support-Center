import { Injectable } from '@angular/core';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { Message, TextMessage, MessageSender, ButtonActionType, ButtonListMessage } from '../../models/message';
import { MessageGroup } from '../../models/message-group';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { HealthCheckComponent } from './health-check.component';
import { AuthService } from '../../../shared/services';

@Injectable()
@RegisterMessageFlowWithFactory()
export class HealthCheckMessageFlow implements IMessageFlowProvider {

    private newFeatureEnabled: boolean = false;

    GetMessageFlowList(): MessageGroup[] {
        var messageGroupList: MessageGroup[] = [];

        let nextAfterHealthCheck = AuthService.newFeatureEnabled ? 'cpuanalysis' : 'feedback';

        console.log(nextAfterHealthCheck);

        var healthCheckGroup: MessageGroup = new MessageGroup('health-check', [], nextAfterHealthCheck);
        healthCheckGroup.messages.push(new TextMessage('First, would you like me to perform a health checkup on your Web App?', MessageSender.System, 2000));
        healthCheckGroup.messages.push(new TextMessage('A health checkup analyzes your Web App and gives you a quick and in-depth overview of your app health according to requests and errors, app performance, CPU usage, and memory usage.', MessageSender.System, 500));
        healthCheckGroup.messages.push(new ButtonListMessage(this._getButtonListForHealthCheck(), 'Run health checkup'));
        healthCheckGroup.messages.push(new TextMessage('Yes, please perform a health checkup on my Web App.', MessageSender.User, 100));
        this.getHealthCheckCommonMessageFlow(healthCheckGroup);

        messageGroupList.push(healthCheckGroup);

        var healthCheckLaterGroup: MessageGroup = new MessageGroup('health-check-later', [], 'feedbackprompt');
        healthCheckLaterGroup.messages.push(new TextMessage('Maybe later.', MessageSender.User, 100));
        healthCheckLaterGroup.messages.push(new TextMessage('Feel free to explore the above tiles to learn more about the health of your Web App and discover additional resources for troubleshooting in the right hand column.', MessageSender.System));
        healthCheckLaterGroup.messages.push(new TextMessage('However, I highly encourage that you perform a health checkup on your Web App.', MessageSender.System));
        healthCheckLaterGroup.messages.push(new ButtonListMessage(this._getButtonListForHealthCheckAgain(), 'Run health checkup Again'));
        healthCheckLaterGroup.messages.push(new TextMessage('Ok. Run health checkup.', MessageSender.User, 100));
        this.getHealthCheckCommonMessageFlow(healthCheckLaterGroup);

        messageGroupList.push(healthCheckLaterGroup);

        var noHealthCheckGroup: MessageGroup = new MessageGroup('no-health-check', [], 'feedback');
        noHealthCheckGroup.messages.push(new TextMessage('No. Maybe another time.', MessageSender.User, 100));
        noHealthCheckGroup.messages.push(new TextMessage('Sorry to hear that I could not be of more help. Please explore our additional resources in the right hand column, especially our popular Support Tools, FAQs, and Community forums.', MessageSender.System));
        messageGroupList.push(noHealthCheckGroup);

        var furtherAssistanceGroup: MessageGroup = new MessageGroup('further-assistance', [], 'feedback');
        furtherAssistanceGroup.messages.push(new TextMessage('I need further assistance.', MessageSender.User, 100));
        furtherAssistanceGroup.messages.push(new TextMessage('Sorry to hear that I could not be of more help. Please explore our additional resources in the right hand column, especially our popular Support Tools, FAQs, and Community forums.', MessageSender.System));
        messageGroupList.push(furtherAssistanceGroup);

        return messageGroupList;
    }

    private _getButtonListForHealthCheck(): any {
        return [{
            title: 'Yes',
            type: ButtonActionType.Continue,
            next_key: ''
        }, {
            title: 'Maybe Later',
            type: ButtonActionType.SwitchToOtherMessageGroup,
            next_key: 'health-check-later'
        }];
    }

    private _getButtonListForHealthCheckAgain(): any {
        return [{
            title: 'Ok. Run health checkup.',
            type: ButtonActionType.Continue,
            next_key: ''
        }, {
            title: 'No. Maybe another time.',
            type: ButtonActionType.SwitchToOtherMessageGroup,
            next_key: 'no-health-check'
        }];
    }

    private _getButtonListForHealthCheckFeedback(): any {
        return [{
            title: 'Yes, thank you!',
            type: ButtonActionType.Continue,
            next_key: ''
        }, {
            title: 'I need further assistance.',
            type: ButtonActionType.SwitchToOtherMessageGroup,
            next_key: 'further-assistance'
        }];
    }

    private getHealthCheckCommonMessageFlow(group: MessageGroup) {
        group.messages.push(new TextMessage('Great, give me a moment while I perform your health checkup…', MessageSender.System, 1000));
        group.messages.push(new TextMessage('Once your health checkup is complete, please use the tabs to navigate between the different categories. Click ‘View Full Report’ to get more details and potential quick solutions and troubleshooting advice.', MessageSender.System, 1000));
        group.messages.push(new HealthCheckMessage());
        if (!AuthService.newFeatureEnabled) {
            group.messages.push(new TextMessage('Thanks for coming in for your health checkup. Did you find the health checkup helpful?', MessageSender.System, 2500));
            group.messages.push(new ButtonListMessage(this._getButtonListForHealthCheckFeedback(), 'Was health checkup useful?'));
            group.messages.push(new TextMessage('Yes, thank you!', MessageSender.User, 100));
            group.messages.push(new TextMessage('Great, I\'m glad I could be of help!', MessageSender.System));
        }

    }
}

export class HealthCheckMessage extends Message {
    constructor() {
        super(HealthCheckComponent, {});
    }
}