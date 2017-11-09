import { Injectable } from '@angular/core';
import { Message, ButtonActionType } from './models/message';
import { MessageGroup } from './models/message-group';
import { MessageFlowFactory } from './message-flow/message-flow.factory';
import { HealthCheckMessageFlow }  from './message-flow/health-check/healthcheckmessageflow';

@Injectable()
export class MessageProcessor {
    private _messageGroups: MessageGroup[] = [];
    private _startingKey: string = 'startup';
    private _currentKey: string;
    private _currentMessageGroup: MessageGroup;
    private _currentMessageIterator: number;

    constructor(private _healthCheckFlow: HealthCheckMessageFlow) {
        this._messageGroups = MessageFlowFactory.getMessageGroups();
        this._currentKey = this._startingKey;
        this._currentMessageIterator = 0;
        this._currentMessageGroup = this._getMessageGroupByKey(this._currentKey);
    }

    private _getMessageGroupByKey(key: string) : MessageGroup {
        let msgGroup = this._messageGroups.find(p => p.key === key);
        if (!msgGroup) {
            // TODO : Log Error Here for missing Message Group.
        }

        return msgGroup;
    }

    public getNextMessage(event: any): Message {

        if(event && event.hasOwnProperty('type') && event.hasOwnProperty('next_key')){
            if(event['type'] === ButtonActionType.SwitchToOtherMessageGroup){

                this._currentMessageIterator = 0;
                this._currentKey = event['next_key'];
    
                this._currentMessageGroup = this._getMessageGroupByKey(this._currentKey);
            }
        }

        if (this._currentMessageIterator >= this._currentMessageGroup.messages.length) {
            if (this._currentMessageGroup.next_key === undefined || this._currentMessageGroup.next_key === '') {
                return null;
            }

            this._currentMessageIterator = 0;
            this._currentKey = this._currentMessageGroup.next_key;

            this._currentMessageGroup = this._getMessageGroupByKey(this._currentKey);
        }

        if (!this._currentMessageGroup) {
            return null;
        }

        let nextMessge: Message = this._currentMessageGroup.messages[this._currentMessageIterator];
        this._currentMessageIterator++;

        return nextMessge;
    }

    public addMessageToCurrentGroup(message: Message){
        if(this._currentMessageGroup && this._currentMessageIterator >= 0){
            this._currentMessageGroup.messages.splice(this._currentMessageIterator, 0, message);
        }
    }
}