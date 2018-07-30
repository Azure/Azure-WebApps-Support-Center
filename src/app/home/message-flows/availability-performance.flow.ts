import { Injectable } from "@angular/core";
import { IMessageFlowProvider } from "../../supportbot/interfaces/imessageflowprovider";
import { RegisterMessageFlowWithFactory } from "../../supportbot/message-flow/message-flow.factory";
import { MessageGroup } from "../../supportbot/models/message-group";
import { TextMessage } from "../../supportbot/models/message";
import { MessageSender } from "../../supportbot/models/message-enums";


@Injectable()
@RegisterMessageFlowWithFactory()
export class AvailabilityPerformanceFlow extends IMessageFlowProvider {
    constructor() {
        super();
    
        // var availailabilityPerformance: MessageGroup = new MessageGroup('availability-performance', [], () => 'feedbackprompt');
        // availailabilityPerformance.messages.push(new TextMessage('Hello! Welcome to App Service diagnostics! My name is Genie and I\'m here to help you diagnose and solve problems'));
    
        // var needMoreHelp: MessageGroup = new MessageGroup('more-help', [], () => 'feedback');
        // needMoreHelp.messages.push(new TextMessage('I need further assistance', MessageSender.User));
        // needMoreHelp.messages.push(new TextMessage('Sorry to hear I could not help you solve your problem', MessageSender.System));
    
        // this.messageFlowList.push(cpuAnalysisGroup);
        // this.messageFlowList.push(needMoreHelp);
      }
      
        
}