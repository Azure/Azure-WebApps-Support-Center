import { MessageGroup } from '../models/message-group';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class IMessageFlowProvider {
    protected additionalMessageFlows: BehaviorSubject<MessageGroup[]> = new BehaviorSubject<MessageGroup[]>(null);

    GetMessageFlowList(): MessageGroup[] {
        return [];
    }

    SubscribeToAdditionalMessageFlowLists(): Observable<MessageGroup[]> {
        return this.additionalMessageFlows;
    }
}