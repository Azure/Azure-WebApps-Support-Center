import { Injectable, Injector } from '@angular/core';
import { Message } from './supportbot/models/message';
import { ActivatedRoute } from '@angular/router';
import { TimePickerInfo } from './fabric-ui/components/detector-time-picker/detector-time-picker.component';
import { BehaviorSubject } from 'rxjs';



@Injectable({providedIn: 'root'})
export class Globals {
  messages: Message[] = [];
  messagesData: { [id: string]: any } = {};
  set openGeniePanel(value: boolean) {
    //if set openFeedback to true,update messages and open genie
    if (value) {
      // this.updateMsgFromLocalStorage();
    }
    //if set openFeedback to false,save messages and close genie
    else {
      //this.saveMsgToLocalStorage();
    }
    this._openGeniePanel = value;
  };
  get openGeniePanel() {
    return this._openGeniePanel;
  }
  private _openGeniePanel:boolean = false;
  openFeedback: boolean = false;
  openTimePicker: boolean = false;
  openSessionPanel: boolean = false;
  openCreateStorageAccountPanel: boolean = false;
  private localStorageKey: string = "genieChat";
  public timePickerInfoSub:BehaviorSubject<TimePickerInfo> = new BehaviorSubject<TimePickerInfo>({
    selectedKey: "Last24Hours"
  });
  constructor(private activatedRoute: ActivatedRoute){
  }

  saveMsgToLocalStorage() {
    const savedMsg = this.messages.map(msg => {
      const copiedMsg = {...msg};
      if (typeof copiedMsg.component === "function") {
        copiedMsg.component = copiedMsg.component.name;
      }
      return copiedMsg;
    });
    localStorage.setItem(this.localStorageKey, JSON.stringify(savedMsg));
  }

  //get detector or category(for categoryoverview) name for feedback
  getDetectorName():string{
    const childRoute = this.activatedRoute.firstChild.firstChild.firstChild.firstChild;
    let detectorName = "";

    if (childRoute.firstChild.snapshot.params["detectorName"]) {
      detectorName = childRoute.firstChild.snapshot.params["detectorName"];
    } else {
      detectorName = childRoute.snapshot.params["category"];
    }
    return detectorName;
  }

  updateTimePickerInfo(updatedInfo:TimePickerInfo) {
    this.timePickerInfoSub.next(updatedInfo);
  }
}
