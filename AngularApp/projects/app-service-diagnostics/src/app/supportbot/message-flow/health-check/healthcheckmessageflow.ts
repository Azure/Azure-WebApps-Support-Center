import { Injectable } from '@angular/core';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { Message, TextMessage, ButtonListMessage } from '../../models/message';
import { MessageGroup } from '../../models/message-group';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { HealthCheckComponent } from './health-check.component';
import { HealthCheckV3Component } from '../health-check-v3/health-check-v3.component';
import { CpuAnalysisChatFlow } from '../cpu-analysis-chat/cpu-analysis-chat-flow';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { BotLoggingService } from '../../../shared/services/logging/bot.logging.service';
import { MessageSender, ButtonActionType } from '../../models/message-enums';

@Injectable()
@RegisterMessageFlowWithFactory()
export class HealthCheckMessageFlow extends IMessageFlowProvider {

    constructor(private _appAnalysisService: AppAnalysisService, private _cpuAnalysisChatFlow: CpuAnalysisChatFlow, private _logger: BotLoggingService) {
        super();
    }

    private _self: HealthCheckMessageFlow = this;

    private newFeatureEnabled: boolean = false;

    GetMessageFlowList(): MessageGroup[] {
        const messageGroupList: MessageGroup[] = [];

        const healthCheckGroup: MessageGroup = new MessageGroup('health-check', [], this._getHealthCheckNextGroupId.bind(this));
        healthCheckGroup.messages.push(new TextMessage('If you don’t know where to start, would you like me to perform a health checkup on your app first?', MessageSender.System, 2000));
        healthCheckGroup.messages.push(new TextMessage('A health checkup analyzes your Web App and gives you a quick and in-depth overview of your app health according to requests and errors, app performance, CPU usage, and memory usage.', MessageSender.System, 500));
        healthCheckGroup.messages.push(new ButtonListMessage(this._getButtonListForHealthCheck(), 'Run health checkup'));
        healthCheckGroup.messages.push(new TextMessage('Yes, please perform a health checkup on my Web App.', MessageSender.User, 100));
        this.getHealthCheckCommonMessageFlow(healthCheckGroup);

        messageGroupList.push(healthCheckGroup);

        const healthCheckLaterGroup: MessageGroup = new MessageGroup('health-check-later', [], () => 'feedbackprompt');
        healthCheckLaterGroup.messages.push(new TextMessage('Maybe later.', MessageSender.User, 100));
        healthCheckLaterGroup.messages.push(new TextMessage('Feel free to explore the above tiles to learn more about the health of your Web App and discover additional resources for troubleshooting in the right hand column.', MessageSender.System));
        healthCheckLaterGroup.messages.push(new TextMessage('However, I highly encourage that you perform a health checkup on your Web App.', MessageSender.System));
        healthCheckLaterGroup.messages.push(new ButtonListMessage(this._getButtonListForHealthCheckAgain(), 'Run health checkup Again'));
        healthCheckLaterGroup.messages.push(new TextMessage('Ok. Run health checkup.', MessageSender.User, 100));
        this.getHealthCheckCommonMessageFlow(healthCheckLaterGroup);

        messageGroupList.push(healthCheckLaterGroup);

        const noHealthCheckGroup: MessageGroup = new MessageGroup('no-health-check', [], () => this._getHealthCheckNextGroupId());
        noHealthCheckGroup.messages.push(new TextMessage('No. Maybe another time.', MessageSender.User, 100));
        messageGroupList.push(noHealthCheckGroup);

        return messageGroupList;
    }

    private _getHealthCheckNextGroupId(): string {
        const nextId = this._cpuAnalysisChatFlow.cpuDetectorResponse && this._cpuAnalysisChatFlow.cpuDetectorResponse.abnormalTimePeriods.length > 0 ? 'cpuanalysis' : 'feedbackprompt';
        this._logger.LogDetectorViewInBot('sitecpuanalysis', nextId === 'cpuanalysis' ? true : false);
        return nextId;
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

    private getHealthCheckCommonMessageFlow(group: MessageGroup) {
        group.messages.push(new TextMessage('Great, give me a moment while I perform your health checkup…', MessageSender.System, 1000));
        group.messages.push(new TextMessage('Once your health checkup is complete, please use the tabs to navigate between the different categories. Click ‘View Full Report’ to get more details and potential quick solutions and troubleshooting advice.', MessageSender.System, 1000));
        group.messages.push(new HealthCheckMessage());
    }
}

export class HealthCheckMessage extends Message {
    constructor() {
        //super(HealthCheckComponent, {});

        //
        // Comment above line and uncomment the below line
        // to enable the applensv3 HealthCheck component
        //
        super(HealthCheckV3Component, {});
    }
}
